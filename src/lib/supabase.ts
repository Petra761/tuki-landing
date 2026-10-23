// src/lib/supabase.ts
// Cliente de Supabase y envío del formulario.
//
// Seguridad: con la clave pública (anon) la base SOLO permite insertar en la tabla
// "interesados" (RLS + permisos por columna, ver supabase/schema.sql). Por eso este
// archivo no tiene ninguna función de lectura: aunque la tuviera, la base la rechazaría.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanId } from '../data/plans'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const CLAVE = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let cliente: SupabaseClient | null = null

/**
 * La librería se descarga recién cuando alguien envía el formulario, así no pesa en la
 * primera carga de la página (importante para quienes la abren desde el celular).
 */
async function obtenerCliente(): Promise<SupabaseClient> {
  if (!URL || !CLAVE) {
    throw new Error('CONFIG')
  }
  if (!cliente) {
    const { createClient } = await import('@supabase/supabase-js')
    // Sin sesión persistente: la landing no tiene usuarios, solo recibe inscripciones.
    cliente = createClient(URL, CLAVE, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return cliente
}

export type ResultadoEnvio =
  | { ok: true }
  | { ok: false; motivo: 'config' | 'datos' | 'red' }

export interface NuevoInteresado {
  nombre: string
  contacto: string
  plan: PlanId
}

export async function inscribir({ nombre, contacto, plan }: NuevoInteresado): Promise<ResultadoEnvio> {
  try {
    const supabase = await obtenerCliente()
    // Sin .select(): la clave pública no puede leer, así que no pedimos la fila de vuelta.
    const { error } = await supabase.from('interesados').insert({
      nombre: nombre.trim(),
      contacto: contacto.trim(),
      plan_interes: plan,
      consentimiento: true,
    })

    if (!error) return { ok: true }

    // 23505 = contacto repetido. Se responde igual que un éxito para no revelar
    // a nadie qué contactos ya están inscritos.
    if (error.code === '23505') return { ok: true }
    // 23514 = la base rechazó un dato (validación del servidor).
    if (error.code === '23514' || error.code === '22001') return { ok: false, motivo: 'datos' }
    return { ok: false, motivo: 'red' }
  } catch (e) {
    if (e instanceof Error && e.message === 'CONFIG') return { ok: false, motivo: 'config' }
    return { ok: false, motivo: 'red' }
  }
}
