// src/components/Historia.tsx
// "Así se ve Tuki": en pantallas grandes, un celular se queda fijo mientras la persona
// avanza por los cuatro beneficios y su pantalla cambia (scroll-driven storytelling).
// En celular no hay elementos fijos: cada beneficio trae su propio celular debajo del texto.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { gsap, ScrollTrigger, prefiereMenosMovimiento } from '../lib/motion'
import { useMediaQuery } from '../lib/hooks'
import { Palabras } from './Palabras'
import { Phone } from './Phone'
import type { Pestana } from './Phone'
import {
  PantallaCuentas,
  PantallaMarcadores,
  PantallaMovimientos,
  PantallaPresupuestos,
} from '../screens/Pantallas'
import './Historia.css'

interface Paso {
  id: string
  titulo: string
  texto: string
  descripcion: string
  pantalla: ReactNode
  pestana: Pestana
}

const PASOS: Paso[] = [
  {
    id: 'registrar',
    pestana: 'movimientos',
    titulo: 'Anota cada ingreso y gasto',
    texto:
      'Escribe el monto, elige la categoría y la cuenta. Cada movimiento queda guardado en tu historial, ordenado por fecha.',
    descripcion: 'Pantalla de movimientos con los gastos de hoy y un sueldo recibido ayer.',
    pantalla: <PantallaMovimientos />,
  },
  {
    id: 'cuentas',
    pestana: 'cuentas',
    titulo: 'Cada cuenta con su saldo',
    texto:
      'Efectivo, banco o ahorros: separa tu dinero por cuentas y mira cuánto tienes en cada una y en total.',
    descripcion: 'Pantalla de cuentas con tres cuentas, su saldo y una línea de tendencia.',
    pantalla: <PantallaCuentas />,
  },
  {
    id: 'presupuestos',
    pestana: 'mas',
    titulo: 'Un límite para cada gasto',
    texto:
      'Define un presupuesto por categoría y revisa cuánto llevas gastado. Si te pasas, lo verás en rojo.',
    descripcion: 'Pantalla de presupuestos con un medidor general y barras por categoría.',
    pantalla: <PantallaPresupuestos />,
  },
  {
    id: 'ordenar',
    pestana: 'mas',
    titulo: 'Ordénalo a tu manera',
    texto:
      'Usa las categorías básicas o crea las tuyas con Premium, y agrupa movimientos con marcadores como #universidad o #casa.',
    descripcion: 'Pantalla de marcadores con el total gastado en cada uno.',
    pantalla: <PantallaMarcadores />,
  },
]

export function Historia() {
  const escritorio = useMediaQuery('(min-width: 900px)')
  const [activo, setActivo] = useState(0)
  const seccion = useRef<HTMLElement>(null)
  const inclinable = useRef<HTMLDivElement>(null)

  // Cambia la pantalla del celular según el beneficio que está en el centro de la vista.
  useEffect(() => {
    if (!escritorio || !seccion.current) return
    const raiz = seccion.current

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.paso').forEach((paso, i) => {
        ScrollTrigger.create({
          trigger: paso,
          start: 'top 58%',
          end: 'bottom 58%',
          onToggle: (self) => self.isActive && setActivo(i),
        })
      })

      // El celular gira despacio mientras dura toda la sección (movimiento ligado al scroll).
      if (!prefiereMenosMovimiento() && inclinable.current) {
        gsap.fromTo(
          inclinable.current,
          { rotateY: -11, rotateZ: -1.5, transformPerspective: 1400 },
          {
            rotateY: 11,
            rotateZ: 1.5,
            ease: 'none',
            scrollTrigger: { trigger: raiz, start: 'top 70%', end: 'bottom 30%', scrub: 1 },
          },
        )
      }
    }, raiz)

    return () => ctx.revert()
  }, [escritorio])

  return (
    <section id="como-funciona" className="seccion historia" ref={seccion} aria-labelledby="historia-titulo">
      <div className="contenedor">
        <header className="historia__cabecera">
          <h2 id="historia-titulo" className="historia__titulo">
            <Palabras texto="Todo tu dinero, en un solo lugar." alEntrar />
          </h2>
          <p>Así se ve Tuki en el celular. Cada pantalla corresponde a algo que ya puedes hacer con la app.</p>
        </header>

        <div className="historia__cuerpo">
          {escritorio && (
            <div className="historia__fijo">
              <div ref={inclinable} className="historia__inclinable">
                <Phone descripcion={PASOS[activo].descripcion} pestana={PASOS[activo].pestana} ancho="min(18rem, 33svh)">
                  <div className="historia__pila">
                    {PASOS.map((paso, i) => (
                      <div key={paso.id} className="historia__pantalla" data-activa={i === activo}>
                        {paso.pantalla}
                      </div>
                    ))}
                  </div>
                </Phone>
              </div>
            </div>
          )}

          <ul className="historia__pasos">
            {PASOS.map((paso, i) => (
              <li key={paso.id} className="paso" data-activo={!escritorio || i === activo}>
                <div className="paso__texto">
                  <h3>{paso.titulo}</h3>
                  <p>{paso.texto}</p>
                </div>
                {!escritorio && (
                  <Phone descripcion={paso.descripcion} pestana={paso.pestana} ancho="min(15.5rem, 62vw)" className="paso__celular">
                    {paso.pantalla}
                  </Phone>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
