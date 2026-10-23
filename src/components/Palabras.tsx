// src/components/Palabras.tsx
// Divide un texto en palabras con máscara para poder animarlas una por una (efecto de
// "subir" cada palabra). Para lectores de pantalla el título se lee completo y normal:
// las palabras sueltas están ocultas (aria-hidden) y el texto entero va en un span .sr-only.

import { useEffect, useRef } from 'react'
import { gsap, prefiereMenosMovimiento } from '../lib/motion'

interface Props {
  texto: string
  /** Si es true, las palabras aparecen solas una vez cuando el título entra en pantalla. */
  alEntrar?: boolean
}

export function Palabras({ texto, alEntrar = false }: Props) {
  const raiz = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!alEntrar || prefiereMenosMovimiento() || !raiz.current) return
    const el = raiz.current
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.palabra'),
        { yPercent: 112, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.95,
          ease: 'power4.out',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [alEntrar])

  const palabras = texto.split(' ')
  return (
    <>
      <span className="sr-only">{texto}</span>
      <span ref={raiz} aria-hidden="true">
        {palabras.map((palabra, i) => (
          <span key={i}>
            <span className="mascara-palabra">
              <span className="palabra anim-palabra">{palabra}</span>
            </span>
            {i < palabras.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </>
  )
}
