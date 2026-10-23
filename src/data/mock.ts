// src/data/mock.ts
// Datos de ejemplo que se muestran DENTRO de los celulares de la página.
// No son datos reales de nadie. Están hechos para que cuadren entre sí:
//   saldo total = suma de las cuentas
//   gastos del mes = suma de los gastos por categoría

export interface CuentaEjemplo {
  nombre: string
  saldo: number
  /** Saldos de los últimos días, solo para dibujar la línea de tendencia. */
  tendencia: number[]
}

export const CUENTAS: CuentaEjemplo[] = [
  { nombre: 'Efectivo', saldo: 412.5, tendencia: [520, 480, 505, 455, 430, 440, 418, 412.5] },
  { nombre: 'Cuenta bancaria', saldo: 2350, tendencia: [1180, 1170, 1160, 1150, 2390, 2380, 2362, 2350] },
  { nombre: 'Ahorros', saldo: 720, tendencia: [600, 600, 640, 640, 680, 680, 720, 720] },
]

export const SALDO_TOTAL = CUENTAS.reduce((suma, c) => suma + c.saldo, 0) // 3.482,50

export const INGRESOS_MES = 4200

export interface GastoCategoria {
  categoria: string
  monto: number
  /** Color de la porción en el gráfico circular. */
  color: string
}

export const GASTOS_POR_CATEGORIA: GastoCategoria[] = [
  { categoria: 'Comida', monto: 520, color: '#FF6A4D' },
  { categoria: 'Vivienda', monto: 400, color: '#FF9A6B' },
  { categoria: 'Transporte', monto: 210, color: '#FFC9A8' },
  { categoria: 'Estudios', monto: 187.5, color: '#8CA096' },
]

export const GASTOS_MES = GASTOS_POR_CATEGORIA.reduce((suma, g) => suma + g.monto, 0) // 1.317,50

export interface MovimientoEjemplo {
  concepto: string
  categoria: string
  cuenta: string
  /** Positivo = ingreso, negativo = gasto. */
  monto: number
  dia: 'Hoy' | 'Ayer'
}

export const MOVIMIENTOS: MovimientoEjemplo[] = [
  { concepto: 'Almuerzo', categoria: 'Comida', cuenta: 'Efectivo', monto: -25, dia: 'Hoy' },
  { concepto: 'Pasaje', categoria: 'Transporte', cuenta: 'Efectivo', monto: -3, dia: 'Hoy' },
  { concepto: 'Sueldo', categoria: 'Ingreso', cuenta: 'Cuenta bancaria', monto: 3800, dia: 'Ayer' },
  { concepto: 'Libros', categoria: 'Estudios', cuenta: 'Cuenta bancaria', monto: -87.5, dia: 'Ayer' },
  { concepto: 'Alquiler', categoria: 'Vivienda', cuenta: 'Cuenta bancaria', monto: -400, dia: 'Ayer' },
]

export interface PresupuestoEjemplo {
  categoria: string
  limite: number
  gastado: number
}

// Un presupuesto por categoría. Transporte supera su límite a propósito, para mostrar
// cómo se ve un presupuesto superado; Vivienda llega justo al límite.
export const PRESUPUESTOS: PresupuestoEjemplo[] = [
  { categoria: 'Comida', limite: 600, gastado: 520 },
  { categoria: 'Vivienda', limite: 400, gastado: 400 },
  { categoria: 'Transporte', limite: 200, gastado: 210 },
  { categoria: 'Estudios', limite: 250, gastado: 187.5 },
]

export interface MarcadorEjemplo {
  nombre: string
  total: number
  movimientos: number
}

export const MARCADORES: MarcadorEjemplo[] = [
  { nombre: 'universidad', total: 275, movimientos: 6 },
  { nombre: 'casa', total: 400, movimientos: 2 },
  { nombre: 'regalos', total: 90, movimientos: 3 },
]

/** Movimientos que llevan el marcador #universidad (se muestran en la pantalla de marcadores). */
export const MOVIMIENTOS_UNIVERSIDAD: MovimientoEjemplo[] = [
  { concepto: 'Libros', categoria: 'Estudios', cuenta: 'Cuenta bancaria', monto: -87.5, dia: 'Ayer' },
  { concepto: 'Impresiones', categoria: 'Estudios', cuenta: 'Efectivo', monto: -12, dia: 'Hoy' },
]
