-- Reinvio della conferma e-mail di un'iscrizione (solo per chi organizza).
-- La Edge Function `bulldogfestival-iscrizioni` lo usa quando riceve { "reinvia": <numero> } con il segreto
-- del vault (lo stesso del report giornaliero). Non è raggiungibile da altri ruoli.
-- Applicata sul progetto Supabase mjzjracjadlybvdttgto il 07/11/2026.

create or replace function public.bf_iscrizione(p_numero integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', id,
    'numero', numero,
    'codice', codice,
    'doppione_di', doppione_di,
    'referente', referente,
    'citta', coalesce(citta, ''),
    'provincia', coalesce(provincia, ''),
    'email', email,
    'accompagnatori', accompagnatori,
    'bulldog', nomi_bulldog,
    'whatsapp', whatsapp,
    'telefono', telefono,
    'stato', stato
  )
  from bulldogfestival.iscrizioni
  where numero = p_numero;
$$;

revoke all on function public.bf_iscrizione(integer) from public, anon, authenticated;
grant execute on function public.bf_iscrizione(integer) to service_role;
