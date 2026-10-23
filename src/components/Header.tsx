// src/components/Header.tsx
// Encabezado fijo. El botón de acceso de prueba queda visible desde el inicio y en todo
// momento, también en celular (los enlaces de texto se ocultan en pantallas angostas).

import { irASeccion } from '../lib/motion'
import { Logo } from './Logo'
import './Header.css'

export function Header() {
  const ir = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    irASeccion(id)
  }

  return (
    <header className="cabecera">
      <div className="contenedor cabecera__interior">
        <a href="#inicio" className="cabecera__logo" aria-label="Tuki, ir al inicio" onClick={ir('inicio')}>
          <Logo />
        </a>
        <nav aria-label="Principal" className="cabecera__nav">
          <a href="#como-funciona" onClick={ir('como-funciona')}>Cómo funciona</a>
          <a href="#planes" onClick={ir('planes')}>Planes</a>
        </nav>
        <a href="#registro" className="btn btn--hoja cabecera__cta" onClick={ir('registro')}>
          Quiero mi acceso
        </a>
      </div>
    </header>
  )
}
