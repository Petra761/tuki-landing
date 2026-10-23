// src/components/Footer.tsx
import { Logo } from './Logo'
import './Footer.css'

export function Footer() {
  return (
    <footer className="pie">
      <div className="contenedor pie__interior">
        <Logo />
        <p>
          Proyecto universitario hecho en Bolivia. Los planes y precios son provisionales. Tus datos solo se
          usan para enviarte tu acceso de prueba.
        </p>
      </div>
    </footer>
  )
}
