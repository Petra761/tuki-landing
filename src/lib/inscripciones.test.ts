import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizarContacto } from './inscripciones'

test('normaliza correos con espacios y mayúsculas', () => {
  assert.equal(normalizarContacto('  Ana.Perez@Ejemplo.COM  '), 'ana.perez@ejemplo.com')
})

test('normaliza teléfonos con prefijo, espacios y guiones', () => {
  assert.equal(normalizarContacto('+591 7123-4567'), '59171234567')
})

test('aplica el prefijo boliviano igual que el trigger de Supabase', () => {
  assert.equal(normalizarContacto('7123 4567'), '59171234567')
})

test('acepta teléfonos normalizados de 8 a 15 dígitos', () => {
  assert.equal(normalizarContacto('12025550184'), '12025550184')
  assert.equal(normalizarContacto('+1 (202) 555.0184'), '12025550184')
})

test('rechaza contactos inválidos y fuera del límite de longitud', () => {
  assert.equal(normalizarContacto('no-es-un-correo'), null)
  assert.equal(normalizarContacto('123-4567'), null)
  assert.equal(normalizarContacto('a'.repeat(121) + '@ejemplo.com'), null)
  assert.equal(normalizarContacto(null), null)
})
