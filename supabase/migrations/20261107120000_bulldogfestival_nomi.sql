-- Nomi dei bulldog per la griglia di zampe del sito (sezione Obiettivo).
-- Solo i nomi, nell'ordine di iscrizione, senza alcun dato del referente; contano le stesse iscrizioni dei
-- contatori pubblici (attive e modificate: né doppioni da verificare né annullate).
-- La Edge Function `bulldogfestival-iscrizioni` li restituisce solo con GET ?nomi=1.
-- Applicata sul progetto Supabase mjzjracjadlybvdttgto il 07/11/2026.

create or replace function public.bf_nomi_bulldog()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(t.nome order by t.numero, t.i), '[]'::jsonb)
  from (
    select i.numero, u.i, u.nome
      from bulldogfestival.iscrizioni i
     cross join lateral unnest(i.nomi_bulldog) with ordinality as u(nome, i)
     where i.stato in ('attiva', 'modificata')
  ) t;
$$;

revoke all on function public.bf_nomi_bulldog() from public, anon, authenticated;
grant execute on function public.bf_nomi_bulldog() to service_role;
