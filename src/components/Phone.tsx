// src/components/Phone.tsx
// Marco de celular hecho solo con HTML y CSS (no es una imagen), así el texto se ve nítido
// en cualquier pantalla y se puede escalar cambiando una sola variable: --w (ancho).
//
// Accesibilidad: lo que hay dentro del marco es una ilustración, por eso va oculto para los
// lectores de pantalla (aria-hidden) y se describe con un <figcaption> solo para ellos.

import type { CSSProperties, ReactNode } from 'react'
import './Phone.css'

export type Pestana = 'inicio' | 'movimientos' | 'cuentas' | 'mas'

const PESTANAS: { id: Pestana | 'registrar'; texto: string }[] = [
  { id: 'inicio', texto: 'Inicio' },
  { id: 'movimientos', texto: 'Movimientos' },
  { id: 'registrar', texto: 'Registrar' },
  { id: 'cuentas', texto: 'Cuentas' },
  { id: 'mas', texto: 'Más' },
]

/** Íconos de la barra inferior, dibujados con trazos simples. */
function Icono({ id }: { id: (typeof PESTANAS)[number]['id'] }) {
  const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  switch (id) {
    case 'inicio':
      return <svg viewBox="0 0 24 24" {...trazo}><path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
    case 'movimientos':
      return <svg viewBox="0 0 24 24" {...trazo}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
    case 'registrar':
      return <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2.6}><path d="M12 5v14M5 12h14" /></svg>
    case 'cuentas':
      return <svg viewBox="0 0 24 24" {...trazo}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M16 12.5h2" /></svg>
    default:
      return <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
  }
}

interface Props {
  /** Descripción en texto de lo que muestra la pantalla (la lee el lector de pantalla). */
  descripcion: string
  children: ReactNode
  className?: string
  /** Pestaña resaltada en la barra inferior. */
  pestana?: Pestana
  /** Ancho del celular, por ejemplo "17rem". El alto y las letras se ajustan solos. */
  ancho?: string
}

export function Phone({ descripcion, children, className = '', ancho, pestana = 'inicio' }: Props) {
  const estilo = ancho ? ({ '--w': ancho } as CSSProperties) : undefined
  return (
    <figure className={`phone ${className}`} style={estilo}>
      <div className="phone__body" aria-hidden="true">
        <span className="phone__island" />
        <div className="phone__screen">
          <div className="phone__status">
            <span>08:12</span>
            <span className="phone__battery" />
          </div>
          {children}
          <div className="phone__nav">
            {PESTANAS.map((t) => (
              <span
                key={t.id}
                className={`phone__tab ${t.id === 'registrar' ? 'phone__tab--mas' : ''} ${t.id === pestana ? 'is-activa' : ''}`}
              >
                <Icono id={t.id} />
                {t.id !== 'registrar' && <small>{t.texto}</small>}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{descripcion}</figcaption>
    </figure>
  )
}
