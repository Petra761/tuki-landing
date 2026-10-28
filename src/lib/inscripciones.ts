const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
const PHONE = /^[0-9]{8,15}$/
const LOCAL_BOLIVIAN_PHONE = /^[67][0-9]{7}$/

export function normalizarContacto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const texto = valor.trim()
  if (!texto || texto.length > 120) return null

  if (texto.includes('@')) {
    const correo = texto.toLowerCase()
    return correo.length <= 120 && EMAIL.test(correo) ? correo : null
  }

  const digitos = texto.replace(/\D/g, '')
  if (!/^[0-9]+$/.test(digitos)) return null

  const telefono = LOCAL_BOLIVIAN_PHONE.test(digitos) ? `591${digitos}` : digitos
  return telefono.length <= 120 && PHONE.test(telefono) ? telefono : null
}
