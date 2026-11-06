-- Report giornaliero delle iscrizioni (sito bulldogfestival).
-- pg_cron chiama ogni giorno la Edge Function `bulldogfestival-report`, che manda a info@gardawellfit.eu
-- riepilogo, segnalazioni ("flag") ed elenco di tutti gli iscritti con il CSV allegato.
-- La chiamata è autenticata da un segreto casuale che vive solo nel vault del database:
-- nessun secret da impostare a mano sul pannello Supabase.
-- Applicata sul progetto Supabase mjzjracjadlybvdttgto il 06/11/2026.

-- Tutte le iscrizioni con i loro flag, già formattate in ora italiana. Solo per la Edge Function (service_role).
create or replace function public.bf_report()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'righe', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'numero', numero,
          'creata', to_char(created_at at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI'),
          'nuova', created_at > now() - interval '24 hours',
          'referente', referente,
          'citta', citta,
          'provincia', provincia,
          'email', email,
          'accompagnatori', accompagnatori,
          'persone', totale_persone,
          'n_bulldog', n_bulldog,
          'bulldog', nomi_bulldog,
          'whatsapp', whatsapp,
          'telefono', telefono,
          'stato', stato,
          'doppione_di', doppione_di,
          'email_stato', email_stato,
          'email_inviata', to_char(email_inviata_il at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI'),
          'codice', codice
        )
        order by numero
      ),
      '[]'::jsonb
    )
  )
  from bulldogfestival.iscrizioni;
$$;

-- Controlla il token della chiamata del cron contro il segreto nel vault.
create or replace function public.bf_report_autorizzato(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from vault.decrypted_secrets
     where name = 'bulldogfestival_report_secret'
       and decrypted_secret = p_token
  );
$$;

revoke all on function public.bf_report() from public, anon, authenticated;
revoke all on function public.bf_report_autorizzato(text) from public, anon, authenticated;
grant execute on function public.bf_report() to service_role;
grant execute on function public.bf_report_autorizzato(text) to service_role;

-- Segreto casuale (creato una sola volta; non esce dal database).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'bulldogfestival_report_secret') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      'bulldogfestival_report_secret',
      'Bearer per bulldogfestival-report (report giornaliero delle iscrizioni)'
    );
  end if;
end $$;

-- Ogni giorno alle 06:00 UTC (07:00 in inverno, 08:00 con l'ora legale).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'bulldogfestival-report-giornaliero') then
    perform cron.unschedule('bulldogfestival-report-giornaliero');
  end if;
  perform cron.schedule(
    'bulldogfestival-report-giornaliero',
    '0 6 * * *',
    $cmd$
      select net.http_post(
        url := 'https://mjzjracjadlybvdttgto.supabase.co/functions/v1/bulldogfestival-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'bulldogfestival_report_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
    $cmd$
  );
end $$;
