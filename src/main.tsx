// src/main.tsx
// Punto de entrada: carga tipografías y estilos, y monta la aplicación.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografías autoalojadas (no dependen de Google Fonts): títulos con peso y ancho variables.
import '@fontsource-variable/bricolage-grotesque/wdth.css'
import '@fontsource-variable/onest/index.css'
import './styles/global.css'
import App from './App'
import { prefiereMenosMovimiento } from './lib/motion'

// Las animaciones de entrada ocultan elementos al inicio; solo se activan aquí, cuando
// ya sabemos que hay JavaScript y que la persona no pidió reducir el movimiento.
if (!prefiereMenosMovimiento()) {
  document.documentElement.classList.add('con-movimiento')
}

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
