// src/screens/Pantallas.tsx
// Las cinco pantallas de ejemplo que se dibujan dentro de los celulares de la página.
// Son HTML y SVG reales alimentados por src/data/mock.ts. Solo muestran cosas que Tuki
// ofrece: movimientos, cuentas, categorías, marcadores y presupuestos.

import { bs, bsConSigno } from '../lib/format'
import {
  CUENTAS,
  GASTOS_MES,
  GASTOS_POR_CATEGORIA,
  INGRESOS_MES,
  MARCADORES,
  MOVIMIENTOS,
  MOVIMIENTOS_UNIVERSIDAD,
  PRESUPUESTOS,
  SALDO_TOTAL,
} from '../data/mock'
import type { MovimientoEjemplo } from '../data/mock'
import './Pantallas.css'

/* ------------------------------------------------------------------ */
/* Piezas gráficas                                                     */
/* ------------------------------------------------------------------ */

/** Gráfico circular: cada porción dura "monto / total" del círculo. */
function Dona({ size = 7 }: { size?: number }) {
  // El radio 15.9155 hace que la circunferencia mida exactamente 100, así los porcentajes
  // se pueden usar directo en stroke-dasharray.
  let acumulado = 0
  return (
    <svg viewBox="0 0 36 36" style={{ width: `${size}em`, height: `${size}em` }} role="presentation">
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgb(241 244 238 / 0.07)" strokeWidth="4.2" />
      {GASTOS_POR_CATEGORIA.map((g) => {
        const pct = (g.monto / GASTOS_MES) * 100
        const porcion = (
          <circle
            key={g.categoria}
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke={g.color}
            strokeWidth="4.2"
            strokeDasharray={`${pct - 1.2} ${100 - pct + 1.2}`}
            strokeDashoffset={25 - acumulado}
            strokeLinecap="round"
          />
        )
        acumulado += pct
        return porcion
      })}
    </svg>
  )
}

/** Línea de tendencia (sparkline) a partir de una lista de valores. */
function Tendencia({ valores }: { valores: number[] }) {
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const rango = max - min || 1
  const puntos = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * 100
    const y = 26 - ((v - min) / rango) * 22
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="pscr-spark" role="presentation">
      <polyline points={puntos.join(' ')} fill="none" stroke="var(--hoja)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Una fila de movimiento: ícono con la inicial, concepto, categoría y cuenta, y monto con color. */
function FilaMovimiento({ m }: { m: MovimientoEjemplo }) {
  const entra = m.monto > 0
  return (
    <li className="pscr-row">
      <span className={`pscr-row__icono ${entra ? 'is-ingreso' : ''}`}>{m.concepto[0]}</span>
      <span className="pscr-row__texto">
        <b>{m.concepto}</b>
        <span>
          {m.categoria}, {m.cuenta}
        </span>
      </span>
      <span className={`pscr-row__monto ${entra ? 'is-ingreso' : 'is-gasto'}`}>{bsConSigno(m.monto)}</span>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Pantallas                                                           */
/* ------------------------------------------------------------------ */

export function PantallaResumen() {
  return (
    <>
      <div className="pscr-head">
        <h4>Resumen</h4>
        <span className="pscr-chip">Octubre</span>
      </div>
      <div>
        <p className="pscr-label">Saldo total</p>
        <p className="pscr-big">{bs(SALDO_TOTAL)}</p>
      </div>
      <div className="pscr-duo">
        <div className="pscr-card">
          <p className="pscr-label">Ingresos</p>
          <b className="is-ingreso">{bsConSigno(INGRESOS_MES)}</b>
        </div>
        <div className="pscr-card">
          <p className="pscr-label">Gastos</p>
          <b className="is-gasto">{bs(-GASTOS_MES)}</b>
        </div>
      </div>
      <div className="pscr-card pscr-dona">
        <Dona />
        <ul className="pscr-leyenda">
          {GASTOS_POR_CATEGORIA.map((g) => (
            <li key={g.categoria}>
              <i style={{ background: g.color }} />
              {g.categoria}
            </li>
          ))}
        </ul>
      </div>
      <section>
        <p className="pscr-label pscr-dia">Últimos movimientos</p>
        <ul className="pscr-rows">
          {MOVIMIENTOS.slice(0, 3).map((m) => (
            <FilaMovimiento key={m.concepto} m={m} />
          ))}
        </ul>
      </section>
    </>
  )
}

export function PantallaMovimientos() {
  const dias = ['Hoy', 'Ayer'] as const
  return (
    <>
      <div className="pscr-head">
        <h4>Movimientos</h4>
        <span className="pscr-chip">Octubre</span>
      </div>
      {dias.map((dia) => (
        <section key={dia}>
          <p className="pscr-label pscr-dia">{dia}</p>
          <ul className="pscr-rows">
            {MOVIMIENTOS.filter((m) => m.dia === dia).map((m) => (
              <FilaMovimiento key={m.concepto} m={m} />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

export function PantallaCuentas() {
  return (
    <>
      <div className="pscr-head">
        <h4>Cuentas</h4>
        <span className="pscr-chip">{CUENTAS.length} cuentas</span>
      </div>
      <div>
        <p className="pscr-label">Total en tus cuentas</p>
        <p className="pscr-big">{bs(SALDO_TOTAL)}</p>
      </div>
      <ul className="pscr-rows pscr-cuentas">
        {CUENTAS.map((c) => (
          <li key={c.nombre} className="pscr-card pscr-cuenta">
            <div>
              <p className="pscr-label">{c.nombre}</p>
              <b>{bs(c.saldo)}</b>
            </div>
            <Tendencia valores={c.tendencia} />
          </li>
        ))}
      </ul>
    </>
  )
}

export function PantallaPresupuestos() {
  const limiteTotal = PRESUPUESTOS.reduce((s, p) => s + p.limite, 0)
  const gastadoTotal = PRESUPUESTOS.reduce((s, p) => s + p.gastado, 0)
  const pct = Math.round((gastadoTotal / limiteTotal) * 100)
  return (
    <>
      <div className="pscr-head">
        <h4>Presupuestos</h4>
        <span className="pscr-chip">Octubre</span>
      </div>
      <div className="pscr-card pscr-medidor">
        <svg viewBox="0 0 36 36" role="presentation">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgb(241 244 238 / 0.08)" strokeWidth="4" />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="var(--hoja)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset="25"
          />
        </svg>
        <div>
          <p className="pscr-big pscr-big--m">{pct}%</p>
          <p className="pscr-label">
            {bs(gastadoTotal)} de {bs(limiteTotal)}
          </p>
        </div>
      </div>
      <ul className="pscr-rows pscr-barras">
        {PRESUPUESTOS.map((p) => {
          const superado = p.gastado > p.limite
          const ancho = Math.min(100, (p.gastado / p.limite) * 100)
          return (
            <li key={p.categoria}>
              <div className="pscr-barra__texto">
                <b>{p.categoria}</b>
                <span className={superado ? 'is-gasto' : ''}>
                  {superado ? `Superado por ${bs(p.gastado - p.limite)}` : `${bs(p.gastado)} de ${bs(p.limite, { sinDecimalesEnteros: true })}`}
                </span>
              </div>
              <div className="pscr-barra">
                <i className={superado ? 'es-superado' : ''} style={{ width: `${ancho}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
      <div className="pscr-card pscr-disponible">
        <p className="pscr-label">Te queda este mes</p>
        <b className="is-ingreso">{bs(limiteTotal - gastadoTotal)}</b>
      </div>
    </>
  )
}

export function PantallaMarcadores() {
  const mayor = Math.max(...MARCADORES.map((m) => m.total))
  return (
    <>
      <div className="pscr-head">
        <h4>Marcadores</h4>
        <span className="pscr-chip">{MARCADORES.length} en uso</span>
      </div>
      <ul className="pscr-etiquetas">
        {MARCADORES.map((m) => (
          <li key={m.nombre}>#{m.nombre}</li>
        ))}
      </ul>
      <ul className="pscr-rows pscr-barras">
        {MARCADORES.map((m) => (
          <li key={m.nombre}>
            <div className="pscr-barra__texto">
              <b>#{m.nombre}</b>
              <span>{m.movimientos} movimientos</span>
            </div>
            <div className="pscr-barra pscr-barra--marcador">
              <i style={{ width: `${(m.total / mayor) * 100}%` }} />
              <em>{bs(m.total)}</em>
            </div>
          </li>
        ))}
      </ul>
      <section>
        <p className="pscr-label pscr-dia">Con #universidad</p>
        <ul className="pscr-rows">
          {MOVIMIENTOS_UNIVERSIDAD.map((m) => (
            <FilaMovimiento key={m.concepto} m={m} />
          ))}
        </ul>
      </section>
    </>
  )
}
