-- supabase/schema.sql
-- ---------------------------------------------------------------------------
-- Esquema completo de la landing de Tuki: tabla "interesados", validaciones,
-- normalización, anti-duplicados y seguridad a nivel de fila (RLS).
--
-- Cómo usarlo: pegarlo en Supabase > SQL Editor > Run. Es idempotente: se puede
-- ejecutar más de una vez sin romper nada. (Ya fue aplicado al proyecto
-- "tuki-landing" como migración "crear_tabla_interesados".)
--
-- Regla de seguridad: con la clave pública (anon) el navegador SOLO puede insertar.
-- Nadie puede leer, actualizar ni borrar desde el navegador. Los datos se consultan
-- y se editan únicamente desde el panel de Supabase (Table Editor), que usa otro rol.
-- ---------------------------------------------------------------------------

-- Tabla de personas interesadas en Tuki (lista de espera / acceso de prueba).
create table if not exists public.interesados (
  id              uuid primary key default gen_random_uuid(),
  creado_en       timestamptz not null default now(),
  nombre          text        not null,
  contacto        text        not null,
  plan_interes    text        not null,
  consentimiento  boolean     not null,
  -- Columnas de seguimiento: no disponibles para el rol público.
  estado          text        not null default 'inscrito',
  canal_envio     text,
  enviado_en      timestamptz,

  constraint interesados_nombre_longitud check (char_length(nombre) between 2 and 80),
  constraint interesados_contacto_formato check (
    -- correo electrónico, o número de WhatsApp ya normalizado (solo dígitos con código de país)
    contacto ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    or contacto ~ '^[0-9]{8,15}$'
  ),
  constraint interesados_contacto_largo check (char_length(contacto) <= 120),
  constraint interesados_plan_valido check (
    plan_interes in ('gratis', 'compra_unica', 'premium_mensual', 'premium_anual')
  ),
  constraint interesados_consentimiento_obligatorio check (consentimiento = true),
  constraint interesados_estado_valido check (
    estado in ('inscrito', 'atendido', 'descartado', 'activo')
  )
);

comment on table public.interesados is
  'Inscritos en la landing de Tuki. El navegador solo puede insertar; la lectura es solo desde el panel.';

-- Normaliza los datos antes de validar, para que el índice único detecte duplicados reales
-- (mayúsculas en correos, espacios, guiones o prefijos "+591" en teléfonos).
create or replace function public.interesados_normalizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nombre   := btrim(new.nombre);
  new.contacto := btrim(new.contacto);

  if position('@' in new.contacto) > 0 then
    new.contacto := lower(new.contacto);
  else
    new.contacto := regexp_replace(new.contacto, '[^0-9]', '', 'g');
    -- Celular boliviano de 8 dígitos (empieza con 6 o 7): se le antepone el código 591.
    if new.contacto ~ '^[67][0-9]{7}$' then
      new.contacto := '591' || new.contacto;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists interesados_normalizar_trg on public.interesados;
create trigger interesados_normalizar_trg
  before insert on public.interesados
  for each row execute function public.interesados_normalizar();

-- Evita duplicados por contacto.
create unique index if not exists interesados_contacto_unico
  on public.interesados (contacto);

-- Seguridad a nivel de fila: activada, y la única política permite INSERT.
alter table public.interesados enable row level security;
alter table public.interesados force row level security;

drop policy if exists "anon puede inscribirse" on public.interesados;
create policy "anon puede inscribirse"
  on public.interesados
  for insert
  to anon
  with check (
    consentimiento = true
    and estado = 'inscrito'
    and canal_envio is null
    and enviado_en is null
  );

-- Permisos: se quita todo y solo se devuelve INSERT sobre 4 columnas para anon.
-- Así, aunque alguien intentara mandar "estado" o "enviado_en", la base lo rechaza.
revoke all on table public.interesados from anon, authenticated, public;
grant insert (nombre, contacto, plan_interes, consentimiento)
  on public.interesados to anon;

-- ---------------------------------------------------------------------------
-- Consultas útiles para ti (ejecútalas en el SQL Editor del panel, no desde la web):
--
--   select creado_en, nombre, contacto, plan_interes, estado
--   from public.interesados order by creado_en desc;
--
--   update public.interesados
--   set estado = 'atendido'
--   where contacto = 'alguien@correo.com';
-- ---------------------------------------------------------------------------
