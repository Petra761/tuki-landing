// src/lib/format.ts
// Formato de bolivianos: punto para miles y coma para decimales (Bs 1.234,50).
// Se hace a mano porque Intl cambia el separador de miles según el navegador
// (en "es" no agrupa los números de 4 cifras) y queremos un resultado idéntico en todos.

interface OpcionesBs {
  /** Si es true, los enteros se muestran sin decimales (Bs 0, Bs 600). */
  sinDecimalesEnteros?: boolean
}

export function bs(valor: number, { sinDecimalesEnteros = false }: OpcionesBs = {}): string {
  const negativo = valor < 0
  const [entero, decimales] = Math.abs(valor).toFixed(2).split('.')
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const cuerpo = sinDecimalesEnteros && decimales === '00' ? miles : `${miles},${decimales}`
  // Se usa el signo menos tipográfico (−) para que se distinga bien del guion.
  return `${negativo ? '−' : ''}Bs ${cuerpo}`
}

/** Versión con signo explícito para movimientos: +Bs 20,00 / −Bs 20,00. */
export function bsConSigno(valor: number): string {
  return valor > 0 ? `+${bs(valor)}` : bs(valor)
}
