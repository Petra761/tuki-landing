import assert from 'node:assert/strict'
import test from 'node:test'
import getHandler from '../../api/inscripciones'
import putHandler from '../../api/inscripciones/estado'
import type { ServerlessRequest, ServerlessResponse } from './serverless'

type Estado = 'inscrito' | 'atendido' | 'descartado' | 'activo'

interface Fila {
  id: string
  creado_en: string
  nombre: string
  contacto: string
  plan_interes: string
  estado: Estado
}

interface RespuestaPrueba extends ServerlessResponse {
  statusCode: number
  body: unknown
  headers: Map<string, string>
}

const API_KEY = 'clave-de-prueba'
const CORREO = 'ana@example.com'

let filas: Fila[] = []
let consultas = 0
let actualizaciones = 0
let llamadasGateway = 0
let cuerpoGateway: unknown

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esEstado(valor: unknown): valor is Estado {
  return valor === 'inscrito' || valor === 'atendido' || valor === 'descartado' || valor === 'activo'
}

function objeto(valor: unknown): Record<string, unknown> {
  if (!esObjeto(valor)) throw new Error('Se esperaba un objeto en la respuesta.')
  return valor
}

function leerCuerpoJson(cuerpo: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof cuerpo !== 'string') throw new Error('El mock recibió un cuerpo inesperado.')
  const valor: unknown = JSON.parse(cuerpo)
  return objeto(valor)
}

function valorFiltrado(valor: string | null): string | null {
  return valor?.startsWith('eq.') ? valor.slice(3) : null
}

function crearFila(cambios: Partial<Fila> = {}): Fila {
  return {
    id: 'fila-1',
    creado_en: '2026-10-28T12:00:00.000Z',
    nombre: 'Ana de Prueba',
    contacto: CORREO,
    plan_interes: 'basico',
    estado: 'inscrito',
    ...cambios,
  }
}

function reiniciar(fixtures: Fila[] = []) {
  filas = fixtures
  consultas = 0
  actualizaciones = 0
  llamadasGateway = 0
  cuerpoGateway = undefined
}

function crearSolicitud(
  method: string,
  opciones: { apiKey?: string | null; contacto?: unknown; estado?: unknown } = {},
): ServerlessRequest {
  const contacto = opciones.contacto === undefined ? CORREO : opciones.contacto
  const estado = opciones.estado === undefined ? 'atendido' : opciones.estado
  const apiKey = opciones.apiKey === undefined ? API_KEY : opciones.apiKey

  return {
    method,
    headers: apiKey === null ? {} : { 'x-api-key': apiKey },
    query: { contacto: typeof contacto === 'string' ? contacto : undefined },
    body: { contacto, estado },
  }
}

function crearRespuesta(): RespuestaPrueba {
  const respuesta: RespuestaPrueba = {
    statusCode: 200,
    body: undefined,
    headers: new Map(),
    setHeader(nombre, valor) {
      this.headers.set(nombre, String(valor))
      return this
    },
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(cuerpo) {
      this.body = cuerpo
      return this
    },
  }
  return respuesta
}

function instalarMocks() {
  globalThis.fetch = async (entrada, opciones) => {
    const url = new URL(entrada instanceof Request ? entrada.url : entrada.toString())
    const metodo = (opciones?.method ?? (entrada instanceof Request ? entrada.method : 'GET')).toUpperCase()

    if (url.pathname === '/rest/v1/interesados' && metodo === 'GET') {
      consultas += 1
      if (url.searchParams.get('limit') !== '2') {
        throw new Error('La consulta debe limitar las coincidencias a dos filas.')
      }
      const contacto = valorFiltrado(url.searchParams.get('contacto'))
      const limite = Number(url.searchParams.get('limit') ?? 2)
      return Response.json(filas.filter((fila) => fila.contacto === contacto).slice(0, limite))
    }

    if (url.pathname === '/rest/v1/interesados' && metodo === 'PATCH') {
      actualizaciones += 1
      const id = valorFiltrado(url.searchParams.get('id'))
      const estadoEsperado = valorFiltrado(url.searchParams.get('estado'))
      const estadoNuevo = leerCuerpoJson(opciones?.body).estado
      if (
        !id ||
        estadoEsperado !== 'inscrito' ||
        !esEstado(estadoNuevo)
      ) {
        throw new Error('El mock recibió una actualización inesperada.')
      }

      const modificadas: Array<Pick<Fila, 'id' | 'estado'>> = []
      filas = filas.map((fila) => {
        if (fila.id !== id || fila.estado !== estadoEsperado) return fila
        const actualizada = { ...fila, estado: estadoNuevo }
        modificadas.push({ id: actualizada.id, estado: actualizada.estado })
        return actualizada
      })
      return Response.json(modificadas)
    }

    if (url.pathname === '/api/users/register' && metodo === 'POST') {
      llamadasGateway += 1
      cuerpoGateway = leerCuerpoJson(opciones?.body)
      return Response.json(
        {
          tenantId: 'tenant-ficticio',
          passwordTemporal: 'clave-temporal-ficticia',
          status: 'Active',
        },
        { status: 201 },
      )
    }

    throw new Error(`Llamada de red no esperada en el mock: ${metodo} ${url.pathname}`)
  }
}

test('las funciones de inscripciones respetan errores, transiciones y aislamiento', async (t) => {
  const fetchAnterior = globalThis.fetch
  const variables = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'LANDING_API_KEY', 'ADMIN_BASE_URL'] as const
  const entornoAnterior = new Map(variables.map((nombre) => [nombre, process.env[nombre]]))

  process.env.SUPABASE_URL = 'http://localhost:54321'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-supabase-ficticia'
  process.env.LANDING_API_KEY = API_KEY
  process.env.ADMIN_BASE_URL = 'http://localhost:5005'
  instalarMocks()

  t.after(() => {
    globalThis.fetch = fetchAnterior
    for (const nombre of variables) {
      const valorAnterior = entornoAnterior.get(nombre)
      if (valorAnterior === undefined) delete process.env[nombre]
      else process.env[nombre] = valorAnterior
    }
  })

  await t.test('400 rechaza contactos y estados inválidos sin consultar servicios', async () => {
    reiniciar([crearFila()])
    const contactoInvalido = crearRespuesta()
    await putHandler(crearSolicitud('PUT', { contacto: 'no-es-un-contacto' }), contactoInvalido)
    assert.equal(contactoInvalido.statusCode, 400)
    assert.equal(objeto(contactoInvalido.body).codigo, 'contacto_invalido')

    const estadoInvalido = crearRespuesta()
    await putHandler(crearSolicitud('PUT', { estado: 'nuevo' }), estadoInvalido)
    assert.equal(estadoInvalido.statusCode, 400)
    assert.equal(objeto(estadoInvalido.body).codigo, 'estado_invalido')
    assert.equal(consultas, 0)
    assert.equal(actualizaciones, 0)
  })

  await t.test('401 rechaza claves ausentes o incorrectas antes de consultar', async () => {
    reiniciar([crearFila()])
    const claveAusente = crearRespuesta()
    await getHandler(crearSolicitud('GET', { apiKey: null }), claveAusente)
    assert.equal(claveAusente.statusCode, 401)

    const claveIncorrecta = crearRespuesta()
    await putHandler(crearSolicitud('PUT', { apiKey: 'incorrecta' }), claveIncorrecta)
    assert.equal(claveIncorrecta.statusCode, 401)
    assert.equal(consultas, 0)
    assert.equal(actualizaciones, 0)
  })

  await t.test('404 se devuelve si no hay una inscripción coincidente', async () => {
    reiniciar()
    const respuesta = crearRespuesta()
    await getHandler(crearSolicitud('GET'), respuesta)
    assert.equal(respuesta.statusCode, 404)
    assert.equal(objeto(respuesta.body).codigo, 'no_encontrado')
  })

  await t.test('409 por coincidencias múltiples no modifica ninguna fila', async () => {
    reiniciar([crearFila(), crearFila({ id: 'fila-2' })])

    const consulta = crearRespuesta()
    await getHandler(crearSolicitud('GET'), consulta)
    assert.equal(consulta.statusCode, 409)
    assert.equal(objeto(consulta.body).codigo, 'multiples_coincidencias')

    const actualizacion = crearRespuesta()
    await putHandler(crearSolicitud('PUT'), actualizacion)
    assert.equal(actualizacion.statusCode, 409)
    assert.equal(objeto(actualizacion.body).codigo, 'multiples_coincidencias')
    assert.deepEqual(filas.map((fila) => fila.estado), ['inscrito', 'inscrito'])
    assert.equal(actualizaciones, 0)
    assert.equal(llamadasGateway, 0)
  })

  await t.test('409 por transición inválida deja la fila intacta', async () => {
    reiniciar([crearFila({ estado: 'atendido' })])
    const respuesta = crearRespuesta()
    await putHandler(crearSolicitud('PUT'), respuesta)
    assert.equal(respuesta.statusCode, 409)
    assert.equal(objeto(respuesta.body).codigo, 'transicion_invalida')
    assert.equal(filas[0].estado, 'atendido')
    assert.equal(actualizaciones, 0)
    assert.equal(llamadasGateway, 0)
  })

  await t.test('422 para teléfono no crea tenant ni cambia la inscripción', async () => {
    const telefono = '59171234567'
    reiniciar([crearFila({ contacto: telefono })])
    const respuesta = crearRespuesta()
    await putHandler(crearSolicitud('PUT', { contacto: '7123 4567' }), respuesta)
    assert.equal(respuesta.statusCode, 422)
    assert.equal(objeto(respuesta.body).codigo, 'contacto_sin_correo')
    assert.equal(filas[0].estado, 'inscrito')
    assert.equal(llamadasGateway, 0)
    assert.equal(actualizaciones, 0)
  })

  await t.test('éxito devuelve antes y después y solo modifica la fila objetivo', async () => {
    const objetivo = crearFila()
    const otraFila = crearFila({
      id: 'fila-no-relacionada',
      contacto: 'otra@example.com',
      nombre: 'Otra Persona',
    })
    reiniciar([objetivo, otraFila])

    const consulta = crearRespuesta()
    await getHandler(crearSolicitud('GET'), consulta)
    assert.equal(consulta.statusCode, 200)
    assert.deepEqual(objeto(consulta.body).registro, objetivo)
    assert.equal(consulta.headers.get('Cache-Control'), 'no-store')

    const respuesta = crearRespuesta()
    await putHandler(crearSolicitud('PUT'), respuesta)
    assert.equal(respuesta.statusCode, 200)
    assert.deepEqual(objeto(respuesta.body).antes, { id: 'fila-1', estado: 'inscrito' })
    assert.deepEqual(objeto(respuesta.body).despues, { id: 'fila-1', estado: 'atendido' })
    assert.deepEqual(objeto(respuesta.body).tenant, {
      tenantId: 'tenant-ficticio',
      passwordTemporal: 'clave-temporal-ficticia',
    })
    assert.deepEqual(filas, [
      { ...objetivo, estado: 'atendido' },
      otraFila,
    ])
    assert.equal(actualizaciones, 1)
    assert.equal(llamadasGateway, 1)
    assert.deepEqual(cuerpoGateway, { email: CORREO, displayName: objetivo.nombre })
    assert.equal(respuesta.headers.get('Cache-Control'), 'no-store')
  })
})
