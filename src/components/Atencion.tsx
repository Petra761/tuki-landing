import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Logo } from './Logo'
import './Atencion.css'

type EstadoInscripcion = 'inscrito' | 'atendido' | 'descartado' | 'activo'

interface Inscripcion {
  id: string
  creado_en: string
  nombre: string
  contacto: string
  plan_interes: string
  estado: EstadoInscripcion
}

interface ReferenciaEstado {
  id: string
  estado: EstadoInscripcion
}

interface ResultadoAtencion {
  antes: ReferenciaEstado
  despues: ReferenciaEstado
  tenant?: {
    tenantId: string
    passwordTemporal: string
  }
}

interface ErrorAtencion {
  status: number | null
  codigo?: string
  mensaje: string
}

class ErrorApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string | undefined,
  ) {
    super('La solicitud no pudo completarse.')
  }
}

const ETIQUETAS_ESTADO: Record<EstadoInscripcion, string> = {
  inscrito: 'Inscrita',
  atendido: 'Atendida',
  descartado: 'Descartada',
  activo: 'Activa',
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esEstado(valor: unknown): valor is EstadoInscripcion {
  return valor === 'inscrito' || valor === 'atendido' || valor === 'descartado' || valor === 'activo'
}

function leerInscripcion(valor: unknown): Inscripcion | null {
  if (
    !esObjeto(valor) ||
    typeof valor.id !== 'string' ||
    typeof valor.creado_en !== 'string' ||
    typeof valor.nombre !== 'string' ||
    typeof valor.contacto !== 'string' ||
    typeof valor.plan_interes !== 'string' ||
    !esEstado(valor.estado)
  ) {
    return null
  }

  return {
    id: valor.id,
    creado_en: valor.creado_en,
    nombre: valor.nombre,
    contacto: valor.contacto,
    plan_interes: valor.plan_interes,
    estado: valor.estado,
  }
}

function leerReferenciaEstado(valor: unknown): ReferenciaEstado | null {
  if (!esObjeto(valor) || typeof valor.id !== 'string' || !esEstado(valor.estado)) return null
  return { id: valor.id, estado: valor.estado }
}

function leerResultadoAtencion(valor: unknown): ResultadoAtencion | null {
  if (!esObjeto(valor)) return null

  const antes = leerReferenciaEstado(valor.antes)
  const despues = leerReferenciaEstado(valor.despues)
  if (!antes || !despues) return null

  if (valor.tenant === undefined) return { antes, despues }
  if (
    !esObjeto(valor.tenant) ||
    typeof valor.tenant.tenantId !== 'string' ||
    typeof valor.tenant.passwordTemporal !== 'string'
  ) {
    return null
  }

  return {
    antes,
    despues,
    tenant: {
      tenantId: valor.tenant.tenantId,
      passwordTemporal: valor.tenant.passwordTemporal,
    },
  }
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json()
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('El servidor devolvió una respuesta inválida.')
    throw error
  }
}

function mensajeDeError(error: unknown): ErrorAtencion {
  if (error instanceof ErrorApi) {
    if (error.status === 400) {
      return { status: 400, mensaje: 'Revisa el contacto y los datos enviados.' }
    }
    if (error.status === 401) {
      return { status: 401, mensaje: 'La clave de atención es incorrecta.' }
    }
    if (error.status === 404) {
      return { status: 404, mensaje: 'No encontramos una inscripción con ese contacto.' }
    }
    if (error.status === 409 && error.codigo === 'multiples_coincidencias') {
      return {
        status: 409,
        codigo: error.codigo,
        mensaje: 'Hay más de una inscripción con ese contacto. Revisa los registros antes de continuar.',
      }
    }
    if (error.status === 409) {
      return {
        status: 409,
        codigo: error.codigo,
        mensaje: 'La inscripción ya cambió de estado. Consúltala de nuevo antes de continuar.',
      }
    }
    if (error.status === 422) {
      return {
        status: 422,
        mensaje: 'Esta inscripción solo tiene teléfono; se necesita un correo para crear la cuenta.',
      }
    }
    if (error.status === 502) {
      return {
        status: 502,
        mensaje:
          'El Gateway no confirmó correctamente el registro. La inscripción no se marcó como atendida; verifica si la cuenta llegó a crearse antes de reintentar.',
      }
    }
    return {
      status: error.status,
      codigo: error.codigo,
      mensaje: 'El servicio no pudo completar la solicitud. Inténtalo más tarde.',
    }
  }

  if (error instanceof TypeError) {
    return {
      status: null,
      mensaje: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    }
  }
  if (error instanceof Error) return { status: null, mensaje: error.message }
  return { status: null, mensaje: 'Ocurrió un error inesperado. Inténtalo de nuevo.' }
}

function ocultar(valor: string, ocultarDatos: boolean): string {
  return ocultarDatos ? '••••••••' : valor
}

function fechaLegible(fecha: string): string {
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(valor)
}

export function Atencion() {
  const [contacto, setContacto] = useState('')
  const [clave, setClave] = useState('')
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null)
  const [resultado, setResultado] = useState<ResultadoAtencion | null>(null)
  const [error, setError] = useState<ErrorAtencion | null>(null)
  const [ocultarDatos, setOcultarDatos] = useState(true)
  const [ocupado, setOcupado] = useState<'consulta' | 'atencion' | null>(null)

  useEffect(() => {
    const tituloAnterior = document.title
    document.title = 'Atención de inscripciones | Tuki'
    return () => {
      document.title = tituloAnterior
    }
  }, [])

  const consultar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setError(null)
    setInscripcion(null)
    setResultado(null)
    setOcultarDatos(true)
    setOcupado('consulta')

    try {
      const parametros = new URLSearchParams({ contacto })
      const respuesta = await fetch(`/api/inscripciones?${parametros}`, {
        headers: { 'X-Api-Key': clave },
      })
      const cuerpo = await leerJson(respuesta)

      if (!respuesta.ok) {
        const codigo = esObjeto(cuerpo) && typeof cuerpo.codigo === 'string' ? cuerpo.codigo : undefined
        throw new ErrorApi(respuesta.status, codigo)
      }
      if (!esObjeto(cuerpo)) throw new Error('El servidor devolvió una respuesta inválida.')

      const registro = leerInscripcion(cuerpo.registro)
      if (!registro) throw new Error('El servidor devolvió una inscripción inválida.')
      setInscripcion(registro)
    } catch (error) {
      setError(mensajeDeError(error))
    } finally {
      setOcupado(null)
    }
  }

  const marcarAtendida = async () => {
    if (!inscripcion || ocupado) return

    setError(null)
    setResultado(null)
    setOcupado('atencion')

    try {
      const respuesta = await fetch('/api/inscripciones/estado', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': clave,
        },
        body: JSON.stringify({ contacto, estado: 'atendido' }),
      })
      const cuerpo = await leerJson(respuesta)

      if (!respuesta.ok) {
        const codigo = esObjeto(cuerpo) && typeof cuerpo.codigo === 'string' ? cuerpo.codigo : undefined
        throw new ErrorApi(respuesta.status, codigo)
      }

      const datos = leerResultadoAtencion(cuerpo)
      if (!datos) throw new Error('El servidor devolvió una respuesta incompleta.')
      setResultado(datos)
    } catch (error) {
      setError(mensajeDeError(error))
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="atencion">
      <a className="saltar" href="#atencion-contenido">
        Saltar al contenido
      </a>
      <header className="atencion__barra">
        <div className="contenedor atencion__barra-interior">
          <a className="atencion__marca" href="/" aria-label="Tuki, volver a la página principal">
            <Logo />
          </a>
          <span className="atencion__etiqueta">Herramienta de atención</span>
        </div>
      </header>

      <main id="atencion-contenido" className="atencion__contenido" tabIndex={-1}>
        <section className="atencion__intro" aria-labelledby="atencion-titulo">
          <p className="atencion__sobrelinea">Acceso de operador</p>
          <h1 id="atencion-titulo">Atención de inscripciones</h1>
          <p>
            Consulta una inscripción y, si tiene correo, crea su usuario y tenant al marcarla como atendida.
          </p>
        </section>

        <section className="atencion__panel" aria-labelledby="consulta-titulo">
          <div className="atencion__panel-cabecera">
            <span className="atencion__numero">01</span>
            <div>
              <h2 id="consulta-titulo">Consultar inscripción</h2>
              <p>La clave solo se mantiene en esta página mientras está abierta.</p>
            </div>
          </div>

          <form className="atencion__formulario" onSubmit={consultar}>
            <div className="atencion__campo">
              <label htmlFor="atencion-contacto">Correo o teléfono</label>
              <input
                id="atencion-contacto"
                name="contacto"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                maxLength={120}
                required
                value={contacto}
                onChange={(evento) => setContacto(evento.target.value)}
              />
            </div>
            <div className="atencion__campo">
              <label htmlFor="atencion-clave">Clave de atención</label>
              <input
                id="atencion-clave"
                name="clave"
                type="password"
                autoComplete="new-password"
                spellCheck={false}
                required
                value={clave}
                onChange={(evento) => setClave(evento.target.value)}
              />
            </div>
            <button className="btn btn--hoja atencion__consultar" type="submit" disabled={ocupado !== null}>
              {ocupado === 'consulta' ? 'Consultando…' : 'Consultar'}
            </button>
          </form>

          {error && (
            <div className="atencion__error" role="alert">
              {error.status !== null && <span className="atencion__http">HTTP {error.status}</span>}
              <p>{error.mensaje}</p>
            </div>
          )}
        </section>

        {inscripcion && (
          <section className="atencion__resultado" aria-labelledby="resultado-titulo">
            <div className="atencion__resultado-cabecera">
              <div>
                <p className="atencion__sobrelinea">Resultado de la consulta</p>
                <h2 id="resultado-titulo">Estado de la inscripción</h2>
              </div>
              <label className="atencion__ocultar">
                <input
                  type="checkbox"
                  checked={ocultarDatos}
                  onChange={(evento) => setOcultarDatos(evento.target.checked)}
                />
                <span>Ocultar datos</span>
              </label>
            </div>

            <div className="atencion__tarjetas">
              <article className="atencion__tarjeta">
                <div className="atencion__tarjeta-cabecera">
                  <div>
                    <p className="atencion__sobrelinea">Antes</p>
                    <h3>{ETIQUETAS_ESTADO[inscripcion.estado]}</h3>
                  </div>
                  <span className="atencion__punto" aria-hidden="true" />
                </div>
                <dl>
                  <div>
                    <dt>Nombre</dt>
                    <dd>{ocultar(inscripcion.nombre, ocultarDatos)}</dd>
                  </div>
                  <div>
                    <dt>Contacto</dt>
                    <dd>{ocultar(inscripcion.contacto, ocultarDatos)}</dd>
                  </div>
                  <div>
                    <dt>Plan de interés</dt>
                    <dd>{inscripcion.plan_interes}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{fechaLegible(inscripcion.creado_en)}</dd>
                  </div>
                </dl>
              </article>

              {resultado && (
                <article className="atencion__tarjeta atencion__tarjeta--despues" aria-live="polite">
                  <div className="atencion__tarjeta-cabecera">
                    <div>
                      <p className="atencion__sobrelinea">Después</p>
                      <h3>{ETIQUETAS_ESTADO[resultado.despues.estado]}</h3>
                    </div>
                    <span className="atencion__punto" aria-hidden="true" />
                  </div>
                  {resultado.tenant ? (
                    <dl>
                      <div>
                        <dt>Tenant ID</dt>
                        <dd className="atencion__secreto">{ocultar(resultado.tenant.tenantId, ocultarDatos)}</dd>
                      </div>
                      <div>
                        <dt>Contraseña temporal</dt>
                        <dd className="atencion__secreto">
                          {ocultar(resultado.tenant.passwordTemporal, ocultarDatos)}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p>La inscripción quedó descartada; no se creó un usuario ni un tenant.</p>
                  )}
                </article>
              )}
            </div>

            {!resultado && (
              <button
                className="btn btn--hoja atencion__atender"
                type="button"
                onClick={marcarAtendida}
                disabled={ocupado !== null}
              >
                {ocupado === 'atencion' ? 'Creando usuario y tenant…' : 'Marcar como atendida'}
              </button>
            )}

            {resultado?.tenant && (
              <p className="atencion__aviso" role="status">
                Guarda la contraseña de forma segura y entrégala a la persona. No se volverá a mostrar después de salir de esta página.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
