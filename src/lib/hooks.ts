// src/lib/hooks.ts
// Hooks pequeños compartidos por varios componentes.

import { useEffect, useState } from 'react'

/** Devuelve true mientras la consulta de medios (media query) se cumpla. */
export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches)

  useEffect(() => {
    const lista = window.matchMedia(consulta)
    const alCambiar = () => setCoincide(lista.matches)
    alCambiar()
    lista.addEventListener('change', alCambiar)
    return () => lista.removeEventListener('change', alCambiar)
  }, [consulta])

  return coincide
}
