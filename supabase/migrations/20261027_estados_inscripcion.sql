-- Pasa los estados al vocabulario de la tarea: inscrito, atendido, descartado.
-- 'activo' queda permitido para una fase posterior, sin usarse todavía.
begin;

alter table public.interesados drop constraint interesados_estado_valido;

update public.interesados set estado = 'inscrito' where estado = 'nuevo';

alter policy "anon puede inscribirse" on public.interesados
  with check (
    consentimiento = true
    and estado = 'inscrito'
    and canal_envio is null
    and enviado_en is null
  );

alter table public.interesados alter column estado set default 'inscrito';

-- Si esta línea falla, hay filas con 'contactado' o 'enviado' que deben revisarse a mano.
alter table public.interesados add constraint interesados_estado_valido
  check (estado = any (array['inscrito', 'atendido', 'descartado', 'activo']));

commit;
