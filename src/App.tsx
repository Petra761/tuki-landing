// src/App.tsx
// Arma la página completa. El plan elegido vive aquí porque lo comparten dos secciones:
// los botones de "Planes" lo marcan y el formulario de "Registro" lo muestra.

import { useEffect, useState } from 'react'
import type { PlanId } from './data/plans'
import { iniciarScrollSuave, irASeccion } from './lib/motion'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { QueEs } from './components/QueEs'
import { Historia } from './components/Historia'
import { Planes } from './components/Planes'
import { Registro } from './components/Registro'
import { Footer } from './components/Footer'

export default function App() {
  const [plan, setPlan] = useState<PlanId | ''>('')

  // Scroll suave de toda la página (se omite si la persona pidió reducir movimiento).
  useEffect(() => iniciarScrollSuave(), [])

  const elegirPlan = (id: PlanId) => {
    setPlan(id)
    irASeccion('registro')
  }

  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" tabIndex={-1}>
        <Hero />
        <QueEs />
        <Historia />
        <Planes alElegir={elegirPlan} />
        <Registro plan={plan} alCambiarPlan={setPlan} />
      </main>
      <Footer />
    </>
  )
}
