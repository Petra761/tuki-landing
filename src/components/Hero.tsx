// src/components/Hero.tsx
// Primera pantalla: titular, llamada a la acción y tres celulares flotantes con la app.
// Movimiento (una sola escena orquestada al cargar): el titular sube palabra por palabra,
// luego entran los celulares y, al hacer scroll, cada uno se desplaza a distinta velocidad.

import { useEffect, useRef } from 'react'
import { gsap, irASeccion, prefiereMenosMovimiento } from '../lib/motion'
import { Palabras } from './Palabras'
import { Phone } from './Phone'
import { PantallaMovimientos, PantallaPresupuestos, PantallaResumen } from '../screens/Pantallas'
import './Hero.css'

export function Hero() {
  const seccion = useRef<HTMLElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)

  // --- Fondo 3D: se descarga cuando el navegador está libre, no antes de mostrar el texto ---
  useEffect(() => {
    let limpiar: (() => void) | undefined
    let cancelado = false

    const cargar = () => {
      import('../lib/hebras').then((modulo) => {
        const canvas = lienzo.current
        if (cancelado || !canvas) return
        limpiar = modulo.iniciarHebras(canvas)
        canvas.classList.add('listo')
      })
    }

    const idle = 'requestIdleCallback' in window
    const id = idle ? window.requestIdleCallback(cargar, { timeout: 1500 }) : window.setTimeout(cargar, 700)

    return () => {
      cancelado = true
      if (idle) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
      limpiar?.()
    }
  }, [])

  // --- Entrada y parallax ---
  useEffect(() => {
    if (prefiereMenosMovimiento() || !seccion.current) return
    const raiz = seccion.current

    const ctx = gsap.context(() => {
      const linea = gsap.timeline({ defaults: { ease: 'power4.out' } })
      linea
        .fromTo('.palabra', { yPercent: 112, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.07 })
        .fromTo('.anim-entrada', { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.45)
        .fromTo(
          '.anim-celular',
          { y: 110, opacity: 0, scale: 0.94 },
          { y: 0, opacity: 1, scale: 1, duration: 1.4, stagger: 0.16 },
          0.35,
        )

      // Parallax suave: la capa interior de cada celular se mueve más o menos según data-vel.
      gsap.utils.toArray<HTMLElement>('.hero-celular__par').forEach((capa) => {
        const velocidad = Number(capa.dataset.vel || -0.08)
        gsap.to(capa, {
          y: () => window.innerHeight * velocidad,
          ease: 'none',
          scrollTrigger: {
            trigger: raiz,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
      })
    }, raiz)

    return () => ctx.revert()
  }, [])

  const ir = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    irASeccion(id)
  }

  return (
    <section id="inicio" className="hero" ref={seccion} aria-labelledby="hero-titulo">
      <canvas ref={lienzo} className="hero__fondo" aria-hidden="true" />

      <div className="contenedor hero__interior">
        <div className="hero__texto">
          <h1 id="hero-titulo" className="hero__titulo">
            <Palabras texto="Sabe a dónde se va tu dinero." />
          </h1>
          <p className="hero__sub anim-entrada">
            Tuki es un registro contable personal. Anota tus ingresos y gastos, separa tu dinero por
            cuentas y controla tus presupuestos desde el celular.
          </p>
          <div className="hero__acciones anim-entrada">
            <a href="#registro" className="btn btn--hoja" onClick={ir('registro')}>
              Quiero mi acceso de prueba
            </a>
            <a href="#planes" className="btn btn--borde" onClick={ir('planes')}>
              Ver planes
            </a>
          </div>
          <p className="hero__nota anim-entrada">Hay un plan gratis. Solo te pedimos un nombre y un contacto.</p>
        </div>

        <div className="hero__escenario" role="group" aria-label="Pantallas de la app de Tuki">
          <div className="hero-celular hero-celular--izq">
            <div className="anim-celular">
            <div className="hero-celular__par" data-vel="-0.13">
              <div className="hero-celular__flota">
                <Phone
                  className="phone--izq"
                  pestana="mas"
                  descripcion="Pantalla de presupuestos: un medidor del total gastado y una barra por categoría; Transporte aparece superado."
                >
                  <PantallaPresupuestos />
                </Phone>
              </div>
            </div>
            </div>
          </div>

          <div className="hero-celular hero-celular--centro">
            <div className="anim-celular">
            <div className="hero-celular__par" data-vel="-0.05">
              <div className="hero-celular__flota">
                <Phone
                  className="phone--centro"
                  pestana="inicio"
                  descripcion="Pantalla de resumen: saldo total, ingresos y gastos del mes y un gráfico circular de gastos por categoría."
                >
                  <PantallaResumen />
                </Phone>
              </div>
            </div>
            </div>
          </div>

          <div className="hero-celular hero-celular--der">
            <div className="anim-celular">
            <div className="hero-celular__par" data-vel="-0.02">
              <div className="hero-celular__flota">
                <Phone
                  className="phone--der"
                  pestana="movimientos"
                  descripcion="Pantalla de movimientos: lista de ingresos y gastos de hoy y de ayer, con su categoría y cuenta."
                >
                  <PantallaMovimientos />
                </Phone>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
