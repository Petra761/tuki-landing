// src/lib/hebras.ts
// Fondo del hero: hebras de luz que fluyen en diagonal (Three.js + un pequeño shader).
// Es solo ambientación: se carga después de que la página ya es visible, se pausa cuando
// el hero sale de pantalla o la pestaña se oculta, y con "reducir movimiento" se dibuja
// un solo cuadro quieto.

import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  Uint16BufferAttribute,
  WebGLRenderer,
} from 'three'
import { prefiereMenosMovimiento } from './motion'

// --- Shader de las hebras ---------------------------------------------------
// Cada vértice conoce su posición a lo largo de la hebra (aT, de 0 a 1) y los parámetros
// de su hebra (aP: separación, fase y amplitud). La curva se calcula en la tarjeta gráfica,
// así que animar cuesta casi nada para el procesador.
const VERTICE_HEBRA = /* glsl */ `
  attribute float aT;
  attribute vec3 aP;
  uniform float uTiempo;
  uniform float uAspecto;
  varying float vT;
  varying float vBrillo;

  void main() {
    float t = aT;
    float separacion = aP.x;
    float fase = aP.y;
    float amplitud = aP.z;

    float x = mix(-1.1, 1.1, t) * uAspecto;
    // Diagonal ascendente: las hebras nacen juntas abajo a la izquierda y se abren hacia arriba.
    float base = mix(-0.95, 0.5, pow(t, 1.1));
    float abanico = separacion * pow(t, 1.5) * 1.15;
    float onda = sin(t * 5.0 + fase + uTiempo * 0.32) * amplitud * (0.15 + t)
               + sin(t * 11.0 - fase * 1.7 + uTiempo * 0.21) * amplitud * 0.25 * t;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, base + abanico + onda, 0.0, 1.0);

    vT = t;
    // Más brillo en el tramo medio; se desvanece en ambos extremos y en las hebras de los bordes.
    float borde = 1.0 - smoothstep(0.55, 1.0, abs(separacion));
    vBrillo = smoothstep(0.0, 0.5, t) * (1.0 - smoothstep(0.82, 1.0, t)) * (0.35 + 0.65 * borde);
  }
`

const FRAGMENTO_HEBRA = /* glsl */ `
  precision mediump float;
  varying float vT;
  varying float vBrillo;
  void main() {
    vec3 lima = vec3(0.784, 0.949, 0.353);
    vec3 turquesa = vec3(0.247, 0.839, 0.690);
    vec3 azul = vec3(0.290, 0.608, 1.0);
    vec3 color = mix(lima, turquesa, smoothstep(0.2, 0.7, vT));
    color = mix(color, azul, smoothstep(0.7, 1.0, vT) * 0.6);
    gl_FragColor = vec4(color, vBrillo * 0.55);
  }
`

// --- Shader de las partículas ----------------------------------------------
const VERTICE_PARTICULA = /* glsl */ `
  attribute vec3 aSemilla; // x, y iniciales y velocidad
  uniform float uTiempo;
  uniform float uAspecto;
  uniform float uTamano;
  varying float vAlfa;
  void main() {
    float y = aSemilla.y + sin(uTiempo * 0.2 * aSemilla.z + aSemilla.x * 6.0) * 0.05;
    float x = aSemilla.x * uAspecto;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, 0.0, 1.0);
    gl_PointSize = uTamano * (0.5 + aSemilla.z);
    vAlfa = 0.25 + 0.55 * fract(aSemilla.x * 13.7 + aSemilla.y * 7.1);
  }
`

const FRAGMENTO_PARTICULA = /* glsl */ `
  precision mediump float;
  varying float vAlfa;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float suave = 1.0 - smoothstep(0.0, 1.0, d);
    gl_FragColor = vec4(0.784, 0.949, 0.353, suave * suave * vAlfa);
  }
`

/** Inicia la escena en el canvas dado. Devuelve la función que la limpia. */
export function iniciarHebras(canvas: HTMLCanvasElement): () => void {
  const reducir = prefiereMenosMovimiento()
  const movil = window.innerWidth < 720
  const numHebras = movil ? 22 : 40
  const segmentos = 90
  const numParticulas = movil ? 90 : 220

  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !movil, powerPreference: 'low-power' })
  } catch {
    // Sin WebGL el hero se ve igual de bien: el fondo es solo un adorno.
    return () => {}
  }
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.25 : 1.75))

  const escena = new Scene()
  const camara = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camara.position.z = 2

  // --- Hebras: una sola geometría con todos los segmentos ---
  const posiciones: number[] = []
  const tramo: number[] = []
  const parametros: number[] = []
  const indices: number[] = []
  for (let i = 0; i < numHebras; i++) {
    const separacion = (i / (numHebras - 1)) * 2 - 1 // de -1 a 1
    const fase = i * 0.37
    const amplitud = 0.05 + ((i * 7) % 5) * 0.012
    const inicio = i * (segmentos + 1)
    for (let j = 0; j <= segmentos; j++) {
      posiciones.push(0, 0, 0) // la posición real se calcula en el shader
      tramo.push(j / segmentos)
      parametros.push(separacion, fase, amplitud)
      if (j < segmentos) indices.push(inicio + j, inicio + j + 1)
    }
  }
  const geoHebras = new BufferGeometry()
  geoHebras.setAttribute('position', new Float32BufferAttribute(posiciones, 3))
  geoHebras.setAttribute('aT', new Float32BufferAttribute(tramo, 1))
  geoHebras.setAttribute('aP', new Float32BufferAttribute(parametros, 3))
  geoHebras.setIndex(new Uint16BufferAttribute(indices, 1))

  const uniformes = { uTiempo: { value: reducir ? 2 : 0 }, uAspecto: { value: 1 }, uTamano: { value: 6 } }
  const matHebras = new ShaderMaterial({
    vertexShader: VERTICE_HEBRA,
    fragmentShader: FRAGMENTO_HEBRA,
    uniforms: uniformes,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  escena.add(new LineSegments(geoHebras, matHebras))

  // --- Partículas ---
  const posParticulas: number[] = []
  const semillas: number[] = []
  for (let i = 0; i < numParticulas; i++) {
    posParticulas.push(0, 0, 0)
    // Se reparten a lo largo de la diagonal para que acompañen a las hebras.
    const t = Math.random()
    semillas.push(-1 + t * 2, -0.7 + t * 1.1 + (Math.random() - 0.5) * 1.1 * t, Math.random())
  }
  const geoParticulas = new BufferGeometry()
  geoParticulas.setAttribute('position', new Float32BufferAttribute(posParticulas, 3))
  geoParticulas.setAttribute('aSemilla', new Float32BufferAttribute(semillas, 3))
  const matParticulas = new ShaderMaterial({
    vertexShader: VERTICE_PARTICULA,
    fragmentShader: FRAGMENTO_PARTICULA,
    uniforms: uniformes,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  escena.add(new Points(geoParticulas, matParticulas))

  // --- Tamaño y bucle ---
  const ajustar = () => {
    const caja = canvas.getBoundingClientRect()
    const ancho = Math.max(1, Math.round(caja.width))
    const alto = Math.max(1, Math.round(caja.height))
    renderer.setSize(ancho, alto, false)
    const aspecto = ancho / alto
    camara.left = -aspecto
    camara.right = aspecto
    camara.updateProjectionMatrix()
    uniformes.uAspecto.value = aspecto
    uniformes.uTamano.value = (movil ? 5 : 7) * renderer.getPixelRatio()
    if (reducir) renderer.render(escena, camara)
  }
  ajustar()
  const observadorTamano = new ResizeObserver(ajustar)
  observadorTamano.observe(canvas)

  let visible = true
  let idAnimacion = 0
  let anterior = performance.now()

  const cuadro = (ahora: number) => {
    uniformes.uTiempo.value += (ahora - anterior) / 1000
    anterior = ahora
    renderer.render(escena, camara)
    idAnimacion = requestAnimationFrame(cuadro)
  }
  const arrancar = () => {
    if (reducir || idAnimacion) return
    anterior = performance.now()
    idAnimacion = requestAnimationFrame(cuadro)
  }
  const pausar = () => {
    cancelAnimationFrame(idAnimacion)
    idAnimacion = 0
  }

  // Se pausa cuando el hero no se ve o la pestaña está en segundo plano (ahorra batería).
  const observadorVisible = new IntersectionObserver(([entrada]) => {
    visible = entrada.isIntersecting
    if (visible && !document.hidden) arrancar()
    else pausar()
  })
  observadorVisible.observe(canvas)
  const alCambiarVisibilidad = () => (document.hidden ? pausar() : visible && arrancar())
  document.addEventListener('visibilitychange', alCambiarVisibilidad)

  if (reducir) renderer.render(escena, camara)
  else arrancar()

  return () => {
    pausar()
    observadorTamano.disconnect()
    observadorVisible.disconnect()
    document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    geoHebras.dispose()
    geoParticulas.dispose()
    matHebras.dispose()
    matParticulas.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
