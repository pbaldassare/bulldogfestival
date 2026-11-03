-- Iscrizioni al 3° Raduno Nazionale Gold Lake Garda Bulldog Francese (sito bulldogfestival).
-- Lo schema non è esposto alle API: ci si arriva solo dalla Edge Function `bulldogfestival-iscrizioni`
-- (service_role) tramite le funzioni public.bf_*, che nessun altro ruolo può eseguire.
-- Applicata sul progetto Supabase mjzjracjadlybvdttgto ("Rank Ai Mediplan e lobby e labpiattaforma") il 03/11/2026.

create schema if not exists bulldogfestival;
revoke all on schema bulldogfestival from public, anon, authenticated;

create table bulldogfestival.iscrizioni (
  id uuid primary key default gen_random_uuid(),
  -- numero progressivo mostrato al partecipante (ISCRIZIONE N. 0001...): mai riassegnato, anche se la riga viene cancellata
  numero integer generated always as identity (start with 1 minvalue 1) not null unique,
  -- codice personale per l'accoglienza del giorno dell'evento (da usare nel QR code)
  codice text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at timestamptz not null default now(),
  referente text not null check (char_length(referente) between 3 and 120),
  citta text check (char_length(citta) <= 80),
  provincia text check (provincia ~ '^[A-Z]{2}$'),
  email text not null check (char_length(email) between 5 and 254),
  email_norm text generated always as (lower(btrim(email))) stored,
  accompagnatori integer not null default 0 check (accompagnatori between 0 and 30),
  totale_persone integer generated always as (accompagnatori + 1) stored,
  n_bulldog integer not null check (n_bulldog between 1 and 30),
  nomi_bulldog text[] not null,
  whatsapp text not null check (whatsapp in ('si', 'no', 'gia')),
  telefono text,
  privacy_accettata_il timestamptz not null default now(),
  stato text not null default 'attiva' check (stato in ('attiva', 'da_verificare', 'modificata', 'annullata')),
  doppione_di integer references bulldogfestival.iscrizioni (numero),
  email_stato text not null default 'da_inviare' check (email_stato in ('da_inviare', 'inviata', 'non_configurata', 'errore')),
  email_inviata_il timestamptz,
  constraint iscrizioni_nomi_bulldog check (cardinality(nomi_bulldog) = n_bulldog),
  -- il telefono c'è se e solo se il partecipante ha chiesto di entrare nel gruppo WhatsApp
  constraint iscrizioni_telefono_se_whatsapp check ((whatsapp = 'si') = (telefono is not null))
);

create index iscrizioni_email_norm_idx on bulldogfestival.iscrizioni (email_norm);

comment on table bulldogfestival.iscrizioni is 'Una riga per iscrizione (un gruppo: referente, accompagnatori e bulldog). Dati personali: accesso solo da Edge Function e dagli organizzatori.';
comment on column bulldogfestival.iscrizioni.stato is 'attiva | da_verificare (stessa e-mail di un''iscrizione già presente: non conta nei contatori finché non è confermata) | modificata | annullata';

alter table bulldogfestival.iscrizioni enable row level security;
revoke all on bulldogfestival.iscrizioni from public, anon, authenticated;

-- Registra un''iscrizione: segnala i doppioni per e-mail (non li blocca) e limita a 3 invii all'ora per indirizzo.
create or replace function public.bf_registra_iscrizione(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p->>'email'));
  v_dup integer;
  v_recenti integer;
  v_row bulldogfestival.iscrizioni;
begin
  select count(*) into v_recenti
    from bulldogfestival.iscrizioni
   where email_norm = v_email and created_at > now() - interval '1 hour';
  if v_recenti >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select min(numero) into v_dup
    from bulldogfestival.iscrizioni
   where email_norm = v_email and stato in ('attiva', 'modificata', 'da_verificare');

  insert into bulldogfestival.iscrizioni
    (referente, citta, provincia, email, accompagnatori, n_bulldog, nomi_bulldog, whatsapp, telefono, stato, doppione_di)
  values (
    btrim(p->>'referente'),
    nullif(btrim(coalesce(p->>'citta', '')), ''),
    nullif(upper(btrim(coalesce(p->>'provincia', ''))), ''),
    btrim(p->>'email'),
    (p->>'accompagnatori')::integer,
    jsonb_array_length(p->'bulldog'),
    array(select btrim(t.x) from jsonb_array_elements_text(p->'bulldog') with ordinality as t(x, i) order by t.i),
    p->>'whatsapp',
    nullif(btrim(coalesce(p->>'telefono', '')), ''),
    case when v_dup is null then 'attiva' else 'da_verificare' end,
    v_dup
  )
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'numero', v_row.numero, 'codice', v_row.codice, 'doppione_di', v_dup);
end;
$$;

-- Contatori pubblici: contano solo le iscrizioni confermate (non i doppioni da verificare, non le annullate).
create or replace function public.bf_contatori()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'iscrizioni', count(*),
    'persone', coalesce(sum(totale_persone), 0),
    'bulldog', coalesce(sum(n_bulldog), 0)
  )
  from bulldogfestival.iscrizioni
  where stato in ('attiva', 'modificata');
$$;

-- Registra l'esito dell'invio della conferma e-mail.
create or replace function public.bf_segna_email(p_id uuid, p_stato text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_stato not in ('inviata', 'non_configurata', 'errore') then
    raise exception 'stato_non_valido';
  end if;
  update bulldogfestival.iscrizioni
     set email_stato = p_stato,
         email_inviata_il = case when p_stato = 'inviata' then now() end
   where id = p_id;
end;
$$;

revoke all on function public.bf_registra_iscrizione(jsonb) from public, anon, authenticated;
revoke all on function public.bf_contatori() from public, anon, authenticated;
revoke all on function public.bf_segna_email(uuid, text) from public, anon, authenticated;
grant execute on function public.bf_registra_iscrizione(jsonb) to service_role;
grant execute on function public.bf_contatori() to service_role;
grant execute on function public.bf_segna_email(uuid, text) to service_role;
