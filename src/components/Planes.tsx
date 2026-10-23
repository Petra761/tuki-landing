// src/components/Planes.tsx
// Planes, precios y tabla de funciones. Nada está escrito a mano aquí: todo sale de
// src/data/plans.ts, así que para cambiar un precio solo se edita ese archivo.

import { COLUMNAS_FUNCIONES, FUNCIONES, PLANES, ahorroAnual } from '../data/plans'
import type { Plan, PlanId } from '../data/plans'
import { bs } from '../lib/format'
import { Palabras } from './Palabras'
import './Planes.css'

interface Props {
  /** Se llama al elegir un plan: el formulario lo deja marcado y la página baja hasta él. */
  alElegir: (id: PlanId) => void
}

function TarjetaPlan({ plan, alElegir, destacado = false }: { plan: Plan; alElegir: Props['alElegir']; destacado?: boolean }) {
  const { mesesEquivalentes, ahorro } = ahorroAnual()
  return (
    <article className={`plan ${destacado ? 'plan--destacado' : ''}`}>
      <h3>{plan.nombre}</h3>
      <p className="plan__precio">
        {/* <data> entrega el valor numérico a buscadores y lectores, aparte del texto con formato. */}
        <data value={plan.precio}>{bs(plan.precio, { sinDecimalesEnteros: true })}</data>
        <span>{plan.cobro}</span>
      </p>
      <p className="plan__descripcion">{plan.descripcion}</p>
      {plan.id === 'premium_anual' && (
        <p className="plan__ahorro">
          Equivale a pagar unos {mesesEquivalentes} meses de 12. Ahorras {bs(ahorro)} frente al mensual.
        </p>
      )}
      <p className="plan__duracion">Duración: {plan.duracion}</p>
      <button
        type="button"
        className={`btn ${destacado ? 'btn--hoja' : plan.columna === 'premium' ? 'btn--borde' : 'btn--tinta'}`}
        onClick={() => alElegir(plan.id)}
        aria-label={`Quiero el plan ${plan.nombre}`}
      >
        Quiero este plan
      </button>
    </article>
  )
}

export function Planes({ alElegir }: Props) {
  const gratis = PLANES.filter((p) => p.columna === 'gratis')
  const sinAnuncios = PLANES.filter((p) => p.columna === 'sinAnuncios')
  const premium = PLANES.filter((p) => p.columna === 'premium')

  return (
    <section id="planes" className="planes" aria-labelledby="planes-titulo">
      <div className="contenedor seccion">
        <header className="planes__cabecera">
          <h2 id="planes-titulo">
            <Palabras texto="Empieza gratis. Cambia de plan cuando lo necesites." alEntrar />
          </h2>
          <p>Precios en bolivianos. Son provisionales y pueden cambiar antes del lanzamiento.</p>
        </header>

        <div className="planes__rejilla">
          {gratis.map((p) => (
            <TarjetaPlan key={p.id} plan={p} alElegir={alElegir} />
          ))}
          {sinAnuncios.map((p) => (
            <TarjetaPlan key={p.id} plan={p} alElegir={alElegir} />
          ))}

          {/* Premium agrupa el plan mensual y el anual en un mismo bloque. */}
          <div className="premium">
            <div className="premium__interior">
              {premium.map((p) => (
                <TarjetaPlan key={p.id} plan={p} alElegir={alElegir} destacado={p.id === 'premium_anual'} />
              ))}
            </div>
          </div>
        </div>

        <div className="tabla" role="region" aria-labelledby="tabla-titulo" tabIndex={0}>
          <table>
            <caption id="tabla-titulo">Funciones por plan</caption>
            <thead>
              <tr>
                <th scope="col">Función</th>
                {COLUMNAS_FUNCIONES.map((c) => (
                  <th key={c.id} scope="col" className={c.id === 'premium' ? 'col-premium' : ''}>
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FUNCIONES.map((f) => (
                <tr key={f.nombre}>
                  <th scope="row">{f.nombre}</th>
                  {COLUMNAS_FUNCIONES.map((c) => (
                    <td key={c.id} className={c.id === 'premium' ? 'col-premium' : ''}>
                      {f.valores[c.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tabla__nota">Premium incluye el plan mensual y el anual.</p>
      </div>
    </section>
  )
}
