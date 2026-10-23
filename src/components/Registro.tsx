// src/components/Registro.tsx
// Formulario de inscripción. Guarda en la tabla "interesados" de Supabase.
//
// Qué hace, en orden:
//   1. Valida en el navegador (nombre, contacto, plan y consentimiento).
//   2. Descarta bots con un campo trampa (honeypot) y con un tiempo mínimo desde que
//      se cargó la página. A los bots se les muestra "éxito" sin guardar nada.
//   3. Envía a Supabase (la base repite las validaciones y evita duplicados).
//   4. Muestra uno de tres estados: enviando, éxito o error.
//
// Por privacidad, el éxito NUNCA repite el nombre ni el contacto escritos en la pantalla.

import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { PLANES } from '../data/plans'
import type { PlanId } from '../data/plans'
import { bs } from '../lib/format'
import { inscribir } from '../lib/supabase'
import { validar } from '../lib/validation'
import type { ErroresFormulario } from '../lib/validation'
import { Palabras } from './Palabras'
import './Registro.css'

interface Props {
  plan: PlanId | ''
  alCambiarPlan: (id: PlanId) => void
}

type Estado = 'inactivo' | 'enviando' | 'exito' | 'error'

const MENSAJES_ERROR = {
  config: 'El formulario no está disponible por ahora. Inténtalo más tarde.',
  datos: 'No pudimos aceptar algún dato. Revisa tu nombre y tu contacto e inténtalo otra vez.',
  red: 'No pudimos guardar tu inscripción. Revisa tu conexión e inténtalo de nuevo.',
} as const

// Tiempo mínimo (ms) que una persona real tarda en llenar el formulario.
const TIEMPO_MINIMO = 2500

export function Registro({ plan, alCambiarPlan }: Props) {
  const idBase = useId()
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)
  const [trampa, setTrampa] = useState('')
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [estado, setEstado] = useState<Estado>('inactivo')
  const [mensajeError, setMensajeError] = useState('')

  const formulario = useRef<HTMLFormElement>(null)
  const cargadoEn = useRef(Date.now())
  const mensajeExito = useRef<HTMLDivElement>(null)

  // Al terminar con éxito, el foco pasa al mensaje para que lo anuncie el lector de pantalla.
  useEffect(() => {
    if (estado === 'exito') mensajeExito.current?.focus()
  }, [estado])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (estado === 'enviando') return

    const nuevos = validar({ nombre, contacto, plan, consentimiento })
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      // Lleva el foco al primer campo con error.
      const primero = (['nombre', 'contacto', 'plan', 'consentimiento'] as const).find((c) => nuevos[c])
      formulario.current?.querySelector<HTMLElement>(`[data-campo="${primero}"]`)?.focus()
      return
    }

    // Bots: campo trampa lleno o formulario enviado demasiado rápido. Se finge éxito.
    if (trampa.trim() !== '' || Date.now() - cargadoEn.current < TIEMPO_MINIMO) {
      setEstado('exito')
      return
    }

    setEstado('enviando')
    setMensajeError('')
    const resultado = await inscribir({ nombre, contacto, plan: plan as PlanId })
    if (resultado.ok) {
      setEstado('exito')
    } else {
      setMensajeError(MENSAJES_ERROR[resultado.motivo])
      setEstado('error')
    }
  }

  const idNombre = `${idBase}-nombre`
  const idContacto = `${idBase}-contacto`
  const idAyudaContacto = `${idBase}-ayuda-contacto`
  const idConsentimiento = `${idBase}-consentimiento`

  return (
    <section id="registro" className="seccion registro" aria-labelledby="registro-titulo">
      <div className="contenedor registro__rejilla">
        <div className="registro__texto">
          <h2 id="registro-titulo">
            <Palabras texto="Pide tu acceso de prueba." alEntrar />
          </h2>
          <p className="registro__sub">
            Déjanos tu nombre y un contacto. Te enviaremos el acceso para que pruebes Tuki desde tu celular.
          </p>

          <aside className="privacidad" aria-labelledby="privacidad-titulo">
            <h3 id="privacidad-titulo">Tus datos, solo para esto</h3>
            <p>
              Usamos tu nombre y tu contacto únicamente para enviarte tu acceso de prueba. No te pedimos
              contraseñas ni datos bancarios, y no mostramos los datos de nadie en esta página.
            </p>
          </aside>
        </div>

        <div className="registro__panel">
          {estado === 'exito' ? (
            <div className="registro__exito" ref={mensajeExito} tabIndex={-1} role="status">
              <h3>¡Listo! Ya estás en la lista.</h3>
              <p>
                Te enviaremos tu acceso de prueba al contacto que dejaste. Si ya te habías inscrito antes, tu
                lugar sigue guardado.
              </p>
            </div>
          ) : (
            <form ref={formulario} onSubmit={enviar} noValidate aria-describedby={estado === 'error' ? `${idBase}-error` : undefined}>
              <div className="campo">
                <label htmlFor={idNombre}>Nombre o alias</label>
                <input
                  id={idNombre}
                  data-campo="nombre"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  aria-invalid={Boolean(errores.nombre)}
                  aria-describedby={errores.nombre ? `${idNombre}-error` : undefined}
                />
                {errores.nombre && (
                  <p id={`${idNombre}-error`} className="campo__error">
                    {errores.nombre}
                  </p>
                )}
              </div>

              <div className="campo">
                <label htmlFor={idContacto}>Correo o WhatsApp</label>
                <input
                  id={idContacto}
                  data-campo="contacto"
                  name="contacto"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  maxLength={120}
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  aria-invalid={Boolean(errores.contacto)}
                  aria-describedby={errores.contacto ? `${idContacto}-error` : idAyudaContacto}
                />
                {errores.contacto ? (
                  <p id={`${idContacto}-error`} className="campo__error">
                    {errores.contacto}
                  </p>
                ) : (
                  <p id={idAyudaContacto} className="campo__ayuda">
                    Por ejemplo: nombre@correo.com o 71234567.
                  </p>
                )}
              </div>

              <fieldset className="campo planes-elegir">
                <legend>Plan que te interesa</legend>
                <div className="planes-elegir__opciones">
                  {PLANES.map((p, i) => (
                    <label key={p.id} className="opcion">
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        checked={plan === p.id}
                        onChange={() => alCambiarPlan(p.id)}
                        data-campo={i === 0 ? 'plan' : undefined}
                        aria-describedby={errores.plan ? `${idBase}-plan-error` : undefined}
                      />
                      <span className="opcion__cuerpo">
                        <b>{p.nombre}</b>
                        <span>{bs(p.precio, { sinDecimalesEnteros: true })}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {errores.plan && (
                  <p id={`${idBase}-plan-error`} className="campo__error">
                    {errores.plan}
                  </p>
                )}
              </fieldset>

              {/* Campo trampa: invisible para personas, tentador para bots. No lo llenes. */}
              <div className="trampa" aria-hidden="true">
                <label>
                  No llenes este campo
                  <input
                    type="text"
                    name="sitio_web"
                    tabIndex={-1}
                    autoComplete="off"
                    value={trampa}
                    onChange={(e) => setTrampa(e.target.value)}
                  />
                </label>
              </div>

              <div className="campo">
                <label className="consentimiento" htmlFor={idConsentimiento}>
                  <input
                    id={idConsentimiento}
                    data-campo="consentimiento"
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    aria-invalid={Boolean(errores.consentimiento)}
                    aria-describedby={errores.consentimiento ? `${idConsentimiento}-error` : undefined}
                  />
                  <span>Acepto que usen mi nombre y mi contacto solo para enviarme mi acceso de prueba.</span>
                </label>
                {errores.consentimiento && (
                  <p id={`${idConsentimiento}-error`} className="campo__error">
                    {errores.consentimiento}
                  </p>
                )}
              </div>

              {estado === 'error' && (
                <p id={`${idBase}-error`} className="registro__error" role="alert">
                  {mensajeError}
                </p>
              )}

              <button type="submit" className="btn btn--hoja registro__enviar" disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Enviando…' : estado === 'error' ? 'Volver a intentar' : 'Quiero mi acceso de prueba'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
