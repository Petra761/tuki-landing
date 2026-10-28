import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export interface Inscripcion {
  id: string
  creado_en: string
  nombre: string
  contacto: string
  plan_interes: string
  estado: 'inscrito' | 'atendido' | 'descartado' | 'activo'
}

export function apiKeyValida(recibida: string | string[] | undefined, esperada: string): boolean {
  if (typeof recibida !== 'string') return false

  const recibidaBytes = Buffer.from(recibida, 'utf8')
  const esperadaBytes = Buffer.from(esperada, 'utf8')
  return (
    recibidaBytes.length === esperadaBytes.length &&
    timingSafeEqual(recibidaBytes, esperadaBytes)
  )
}

export function crearClienteSupabase() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  let supabaseUrl: URL
  try {
    supabaseUrl = new URL(url)
  } catch (error) {
    if (error instanceof TypeError) return null
    throw error
  }
  if (
    supabaseUrl.protocol !== 'https:' &&
    !(
      supabaseUrl.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(supabaseUrl.hostname)
    )
  ) {
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function buscarCoincidencias(
  supabase: NonNullable<ReturnType<typeof crearClienteSupabase>>,
  contacto: string,
) {
  return supabase
    .from('interesados')
    .select('id, creado_en, nombre, contacto, plan_interes, estado')
    .eq('contacto', contacto)
    .limit(2)
    .returns<Inscripcion[]>()
}

export function urlRegistroGateway(): string | null {
  const baseUrl = process.env.ADMIN_BASE_URL
  if (!baseUrl) return null

  let url: URL
  try {
    url = new URL('/api/users/register', baseUrl)
  } catch (error) {
    if (error instanceof TypeError) return null
    throw error
  }
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  ) {
    return null
  }
  return url.toString()
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}
