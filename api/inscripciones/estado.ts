import { normalizarContacto } from '../../src/lib/inscripciones'
import {
  apiKeyValida,
  buscarCoincidencias,
  crearClienteSupabase,
  esObjeto,
  type Inscripcion,
  urlRegistroGateway,
} from '../../src/lib/inscripciones-server'
import type { ServerlessRequest, ServerlessResponse } from '../../src/lib/serverless'

interface RegistroAdmin {
  tenantId: string
  passwordTemporal: string
}

function leerRegistroAdmin(valor: unknown): RegistroAdmin | null {
  if (!esObjeto(valor)) return null

  return typeof valor.tenantId === 'string' &&
    valor.tenantId.length > 0 &&
    typeof valor.passwordTemporal === 'string' &&
    valor.passwordTemporal.length > 0 &&
    valor.status === 'Active'
    ? { tenantId: valor.tenantId, passwordTemporal: valor.passwordTemporal }
    : null
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT')
    return res.status(405).json({ error: 'Método no permitido.', codigo: 'metodo_no_permitido' })
  }

  const apiKey = process.env.LANDING_API_KEY
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'Falta configurar LANDING_API_KEY.', codigo: 'configuracion_incompleta' })
  }
  if (!apiKeyValida(req.headers['x-api-key'], apiKey)) {
    return res.status(401).json({ error: 'Clave de API inválida.', codigo: 'no_autorizado' })
  }

  if (!esObjeto(req.body)) {
    return res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON.', codigo: 'cuerpo_invalido' })
  }

  const contacto = normalizarContacto(req.body.contacto)
  const estado = req.body.estado
  if (!contacto) {
    return res.status(400).json({ error: 'Contacto inválido.', codigo: 'contacto_invalido' })
  }
  if (estado !== 'atendido' && estado !== 'descartado') {
    return res.status(400).json({ error: 'Estado inválido.', codigo: 'estado_invalido' })
  }

  const supabase = crearClienteSupabase()
  if (!supabase) {
    return res
      .status(500)
      .json({
        error: 'La configuración de Supabase falta o es inválida.',
        codigo: 'configuracion_incompleta',
      })
  }

  const { data, error } = await buscarCoincidencias(supabase, contacto)

  if (error) {
    console.error('Error consultando inscripciones en Supabase.', { code: error.code })
    return res
      .status(500)
      .json({ error: 'No se pudo consultar la inscripción.', codigo: 'error_supabase' })
  }
  if (data.length === 0) {
    return res.status(404).json({ error: 'No existe una inscripción para ese contacto.', codigo: 'no_encontrado' })
  }
  if (data.length > 1) {
    return res.status(409).json({
      error: 'Hay más de una inscripción para ese contacto.',
      codigo: 'multiples_coincidencias',
    })
  }

  const antes = data[0]
  if (antes.estado !== 'inscrito') {
    return res.status(409).json({
      error: 'La inscripción ya no está en estado inscrito.',
      codigo: 'transicion_invalida',
    })
  }

  let tenant: RegistroAdmin | undefined
  if (estado === 'atendido') {
    if (!contacto.includes('@')) {
      return res.status(422).json({
        error: 'Se necesita un correo para crear el usuario.',
        codigo: 'contacto_sin_correo',
      })
    }

    const urlRegistro = urlRegistroGateway()
    if (!urlRegistro) {
      return res
        .status(500)
        .json({
          error: 'ADMIN_BASE_URL falta o es inválida.',
          codigo: 'configuracion_incompleta',
        })
    }

    let respuestaAdmin: Response
    try {
      respuestaAdmin = await fetch(urlRegistro, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contacto, displayName: antes.nombre }),
        signal: AbortSignal.timeout(60_000),
      })
    } catch (error) {
      if (
        error instanceof TypeError ||
        (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name))
      ) {
        return res.status(502).json({
          error: 'No se pudo conectar con el Administrador.',
          codigo: 'fallo_administrador',
        })
      }
      throw error
    }

    if (respuestaAdmin.status !== 201) {
      return res.status(502).json({
        error: 'El Administrador no pudo crear el usuario y el tenant.',
        codigo: 'fallo_administrador',
      })
    }

    let cuerpoAdmin: unknown
    try {
      cuerpoAdmin = await respuestaAdmin.json()
    } catch (error) {
      if (
        error instanceof SyntaxError ||
        error instanceof TypeError ||
        (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name))
      ) {
        return res.status(502).json({
          error: 'El Administrador devolvió una respuesta inválida.',
          codigo: 'respuesta_administrador_invalida',
        })
      }
      throw error
    }

    tenant = leerRegistroAdmin(cuerpoAdmin) ?? undefined
    if (!tenant) {
      return res.status(502).json({
        error: 'El Administrador devolvió datos de tenant inválidos.',
        codigo: 'respuesta_administrador_invalida',
      })
    }
  }

  const { data: despues, error: errorActualizacion } = await supabase
    .from('interesados')
    .update({ estado })
    .eq('id', antes.id)
    .eq('estado', 'inscrito')
    .select('id, estado')
    .returns<Pick<Inscripcion, 'id' | 'estado'>[]>()

  if (errorActualizacion) {
    console.error('Error actualizando el estado de la inscripción.', {
      code: errorActualizacion.code,
    })
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar la inscripción.', codigo: 'error_supabase' })
  }
  if (despues.length !== 1) {
    return res.status(409).json({
      error: 'La inscripción cambió mientras se procesaba la solicitud.',
      codigo: 'transicion_invalida',
    })
  }

  return res.status(200).json({
    antes: { id: antes.id, estado: antes.estado },
    despues: despues[0],
    ...(tenant ? { tenant } : {}),
  })
}
