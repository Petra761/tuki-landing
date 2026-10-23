# Tuki — landing de inscripción

Landing de **Tuki**, un registro contable personal (ingresos, gastos, cuentas, presupuestos).
Recibe inscritos para el acceso de prueba y los guarda en Supabase.

**Stack:** Vite + React + TypeScript · GSAP + Lenis (movimiento) · Three.js (fondo del hero) · Supabase · Vercel.

## Estructura

```
src/
  data/plans.ts        ← ÚNICO lugar con planes, precios y tabla de funciones
  data/mock.ts         ← datos de ejemplo que se ven dentro de los celulares
  components/          ← secciones de la página (Hero, Historia, Planes, Registro...)
  screens/             ← pantallas de ejemplo dibujadas dentro de los celulares
  lib/                 ← supabase.ts, validation.ts, motion.ts, hebras.ts (Three.js)
supabase/schema.sql    ← tabla, validaciones y políticas RLS
.env.example           ← variables necesarias (sin secretos)
```

## Ejecutarlo en local

Requiere Node 20 o superior.

```bash
npm install
cp .env.example .env     # luego completa los dos valores (ver abajo)
npm run dev              # http://localhost:5173
```

Otros comandos: `npm run build` (compila a `dist/`), `npm run preview` (sirve lo compilado),
`npm run typecheck` (revisa los tipos).

## Variables de entorno

| Variable | Dónde se obtiene |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → clave `anon` o `publishable` |

Ambas son **públicas por diseño** (viajan en el navegador). La seguridad no depende de ocultarlas
sino de las políticas RLS de la base. **Nunca** uses aquí la clave `service_role`.
El archivo `.env` está en `.gitignore`; solo se sube `.env.example`.

## Base de datos (Supabase)

1. Abre el proyecto → **SQL Editor**.
2. Pega el contenido de `supabase/schema.sql` y pulsa **Run** (se puede repetir sin problema).

Qué garantiza ese esquema:

- **RLS activada** y una única política: la clave pública solo puede **insertar**.
- Sin permisos de lectura, actualización ni borrado para el navegador.
- El navegador solo puede escribir 4 columnas (`nombre`, `contacto`, `plan_interes`, `consentimiento`).
  `estado`, `canal_envio` y `enviado_en` solo se editan desde el panel.
- **Sin duplicados** por contacto: se normaliza (correo en minúsculas; celular de 8 dígitos →
  `591` + número) y hay un índice único.
- Validación en la base: nombre de 2 a 80 caracteres, contacto con formato válido, plan entre los
  cuatro permitidos y consentimiento obligatorio.

Para ver los inscritos: **Table Editor → interesados** (o con SQL en el panel).

### Comprobar que el navegador no puede leer (cambia URL y clave)

```bash
URL="https://TU-PROYECTO.supabase.co"; KEY="tu-clave-anon"

# Leer: debe responder error de permisos (42501), nunca datos.
curl -s "$URL/rest/v1/interesados?select=*" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"

# Borrar y actualizar: también deben fallar.
curl -s -X DELETE "$URL/rest/v1/interesados?id=not.is.null" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -s -X PATCH  "$URL/rest/v1/interesados?id=not.is.null" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{"estado":"enviado"}'
```

## Cambiar planes, precios y funciones

Edita solo **`src/data/plans.ts`**. La sección de planes, la tabla de funciones y el selector del
formulario se generan desde ahí. El texto "equivale a pagar unos 8 meses de 12 / ahorras Bs 38,90"
se calcula solo a partir de los precios mensual y anual.

> Si agregas un plan nuevo, su `id` también debe permitirse en la restricción
> `interesados_plan_valido` de `supabase/schema.sql`.

## Desplegar en Vercel

1. Sube el proyecto a GitHub.
2. En Vercel: **Add New → Project** → importa el repositorio. Vercel detecta Vite solo
   (build: `npm run build`, salida: `dist`).
3. En **Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (para Production, Preview y Development).
4. **Deploy**. Si cambias las variables después, haz un nuevo deploy (Vite las incorpora al compilar).

## Notas de diseño y rendimiento

- **Color con significado:** lima = dinero que entra, coral = dinero que sale (también en los celulares).
- Los celulares son HTML y SVG reales (no imágenes): texto nítido y accesible. Para lectores de
  pantalla cada celular tiene una descripción en texto.
- Three.js y la librería de Supabase se descargan **bajo demanda** (el fondo 3D cuando el navegador
  está libre; Supabase al enviar el formulario), para que la primera carga en celular sea ligera.
- Con "reducir movimiento" activado en el sistema, no hay scroll suave ni animaciones y el fondo
  3D se dibuja quieto.
- Anti-spam: campo trampa (honeypot) y tiempo mínimo de 2,5 s desde que carga la página. A los bots
  se les muestra "éxito" sin guardar nada. Si pruebas el formulario de forma automática, espera ese tiempo.
- Un contacto repetido se muestra como éxito (para no revelar quién está inscrito).
