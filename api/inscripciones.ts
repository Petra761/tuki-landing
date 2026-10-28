import { normalizarContacto } from '../src/lib/inscripciones'
import {
  apiKeyValida,
  buscarCoincidencias,
  crearClienteSupabase,
} from '../src/lib/inscripciones-server'
import type { ServerlessRequest, ServerlessResponse } from '../src/lib/serverless'

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
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

  const contacto = normalizarContacto(req.query.contacto)
  if (!contacto) {
    return res.status(400).json({ error: 'Contacto inválido.', codigo: 'contacto_invalido' })
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

  return res.status(200).json({ registro: data[0] })
}
