// src/data/plans.ts
// ---------------------------------------------------------------------------
// ÚNICO lugar donde viven los planes, sus precios y la tabla de funciones.
// Para cambiar un precio, una duración o una función basta con editar este
// archivo: la sección de planes, la tabla y el selector del formulario se
// generan a partir de aquí.
// ---------------------------------------------------------------------------

/** Identificadores que también acepta la base de datos (ver supabase/schema.sql). */
export type PlanId = 'gratis' | 'compra_unica' | 'premium_mensual' | 'premium_anual'

/** Columna de la tabla de funciones a la que pertenece cada plan. */
export type ColumnaFunciones = 'gratis' | 'sinAnuncios' | 'premium'

export interface Plan {
  id: PlanId
  nombre: string
  /** Precio en bolivianos. Con 0 se muestra "Bs 0". */
  precio: number
  /** Texto corto bajo el precio (cómo se paga). */
  cobro: string
  /** Duración del acceso, tal como se muestra al visitante. */
  duracion: string
  descripcion: string
  columna: ColumnaFunciones
}

export const PLANES: Plan[] = [
  {
    id: 'gratis',
    nombre: 'Gratis',
    precio: 0,
    cobro: 'Sin costo',
    duracion: 'Sin vencimiento',
    descripcion: 'Las funciones esenciales para empezar. Incluye anuncios.',
    columna: 'gratis',
  },
  {
    id: 'compra_unica',
    nombre: 'Compra única',
    precio: 19.9,
    cobro: 'Pago único',
    duracion: 'Sin vencimiento',
    descripcion:
      'Quita los anuncios para siempre. Mantiene los límites del plan gratuito.',
    columna: 'sinAnuncios',
  },
  {
    id: 'premium_mensual',
    nombre: 'Premium mensual',
    precio: 9.9,
    cobro: 'Cada 30 días',
    duracion: '30 días',
    descripcion: 'Sin anuncios y con todas las funciones avanzadas.',
    columna: 'premium',
  },
  {
    id: 'premium_anual',
    nombre: 'Premium anual',
    precio: 79.9,
    cobro: 'Cada 365 días',
    duracion: '365 días',
    descripcion: 'Sin anuncios y con todas las funciones avanzadas.',
    columna: 'premium',
  },
]

/** Busca un plan por su identificador. */
export const planPorId = (id: PlanId): Plan => {
  const plan = PLANES.find((p) => p.id === id)
  if (!plan) throw new Error(`Plan desconocido: ${id}`)
  return plan
}

/**
 * Ahorro del plan anual frente a pagar 12 meses del mensual.
 * Se calcula a partir de los precios de arriba para que nunca se desfase.
 */
export const ahorroAnual = () => {
  const mensual = planPorId('premium_mensual').precio
  const anual = planPorId('premium_anual').precio
  return {
    // Cuántos meses "equivale" pagar el plan anual (redondeado).
    mesesEquivalentes: Math.round(anual / mensual),
    // Diferencia en bolivianos frente a 12 pagos mensuales.
    ahorro: Math.round((mensual * 12 - anual) * 100) / 100,
  }
}

// ---------------------------------------------------------------------------
// Tabla de funciones por plan
// ---------------------------------------------------------------------------

export interface Funcion {
  nombre: string
  /** Valor para cada columna. Se muestra tal cual en la tabla. */
  valores: Record<ColumnaFunciones, string>
}

export const COLUMNAS_FUNCIONES: { id: ColumnaFunciones; titulo: string }[] = [
  { id: 'gratis', titulo: 'Gratis' },
  { id: 'sinAnuncios', titulo: 'Sin anuncios' },
  { id: 'premium', titulo: 'Premium' },
]

export const FUNCIONES: Funcion[] = [
  {
    nombre: 'Registrar ingresos y gastos',
    valores: { gratis: 'Sí', sinAnuncios: 'Sí', premium: 'Sí' },
  },
  {
    nombre: 'Historial de movimientos',
    valores: { gratis: 'Sí', sinAnuncios: 'Sí', premium: 'Sí' },
  },
  {
    nombre: 'Categorías',
    valores: { gratis: 'Básicas', sinAnuncios: 'Básicas', premium: 'Personalizadas' },
  },
  {
    nombre: 'Cuentas',
    valores: { gratis: 'Hasta 3', sinAnuncios: 'Hasta 3', premium: 'Ilimitadas' },
  },
  {
    nombre: 'Marcadores',
    valores: { gratis: 'Hasta 5', sinAnuncios: 'Hasta 5', premium: 'Ilimitados' },
  },
  {
    nombre: 'Presupuestos',
    valores: { gratis: 'Hasta 2', sinAnuncios: 'Hasta 2', premium: 'Ilimitados' },
  },
  {
    nombre: 'Anuncios',
    valores: { gratis: 'Sí', sinAnuncios: 'No', premium: 'No' },
  },
]
