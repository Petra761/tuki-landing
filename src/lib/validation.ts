// src/lib/validation.ts
// Validación del formulario en el navegador. Las mismas reglas se repiten en la
// base de datos (supabase/schema.sql): la validación del cliente solo mejora la
// experiencia, la que de verdad protege es la de la base.

import type { PlanId } from '../data/plans'

export interface DatosFormulario {
  nombre: string
  contacto: string
  plan: PlanId | ''
  consentimiento: boolean
}

export type ErroresFormulario = Partial<Record<keyof DatosFormulario, string>>

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

/** Devuelve los dígitos de un teléfono ("+591 7123-4567" → "59171234567"). */
const soloDigitos = (texto: string) => texto.replace(/\D/g, '')

/** True si el texto parece un celular boliviano o un número internacional con "+". */
export function esWhatsappValido(texto: string): boolean {
  const digitos = soloDigitos(texto)
  // Celular boliviano de 8 dígitos (empieza con 6 o 7).
  if (/^[67]\d{7}$/.test(digitos)) return true
  // Con código de país de Bolivia: 591 + celular.
  if (/^591[67]\d{7}$/.test(digitos)) return true
  // Otro país: debe venir con "+" y tener entre 8 y 15 dígitos.
  return texto.trim().startsWith('+') && /^\d{8,15}$/.test(digitos)
}

export const esCorreoValido = (texto: string) => EMAIL.test(texto.trim())

export function validar(datos: DatosFormulario): ErroresFormulario {
  const errores: ErroresFormulario = {}
  const nombre = datos.nombre.trim()
  const contacto = datos.contacto.trim()

  if (nombre.length < 2) errores.nombre = 'Escribe tu nombre o un alias de al menos 2 letras.'
  else if (nombre.length > 80) errores.nombre = 'Usa un máximo de 80 caracteres.'

  if (!contacto) errores.contacto = 'Déjanos un correo o un número de WhatsApp.'
  else if (contacto.length > 120) errores.contacto = 'El contacto es demasiado largo.'
  else if (!esCorreoValido(contacto) && !esWhatsappValido(contacto))
    errores.contacto = 'Escribe un correo válido (nombre@correo.com) o un celular de 8 dígitos.'

  if (!datos.plan) errores.plan = 'Elige el plan que te interesa.'

  if (!datos.consentimiento)
    errores.consentimiento = 'Necesitamos tu consentimiento para enviarte el acceso de prueba.'

  return errores
}
