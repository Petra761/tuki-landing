// src/lib/motion.ts
// Capa de movimiento de la página: scroll suave (Lenis) sincronizado con GSAP ScrollTrigger.
// Si la persona pidió "reducir movimiento" en su sistema, nada de esto se activa y la
// página se ve completa y estática.

import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

export const prefiereMenosMovimiento = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

/** Activa el scroll suave. Devuelve la función que lo desactiva. */
export function iniciarScrollSuave(): () => void {
  if (prefiereMenosMovimiento()) return () => {}

  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 })
  lenis.on('scroll', ScrollTrigger.update)

  const tick = (tiempo: number) => lenis?.raf(tiempo * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  // Las fuentes y las imágenes cambian la altura de la página: se recalculan las posiciones.
  const refrescar = () => ScrollTrigger.refresh()
  window.addEventListener('load', refrescar)
  document.fonts?.ready.then(refrescar)

  return () => {
    window.removeEventListener('load', refrescar)
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

/** Lleva la vista a una sección por su id, usando el scroll suave si está activo. */
export function irASeccion(id: string): void {
  const destino = document.getElementById(id)
  if (!destino) return
  if (lenis) lenis.scrollTo(destino, { offset: -8, duration: 1.2 })
  else destino.scrollIntoView({ behavior: 'auto', block: 'start' })
  // Mueve el foco para quienes navegan con teclado o lector de pantalla.
  destino.setAttribute('tabindex', '-1')
  destino.focus({ preventScroll: true })
}
