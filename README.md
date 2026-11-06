# 3° Raduno Nazionale Gold Lake Garda — Bulldog Francese

Sito di una pagina per il raduno di **sabato 25 settembre 2027** al Parco del Castello di Moniga del Garda, con l'obiettivo di riunire 1.001 bulldog francesi.

Statico: HTML, CSS e JavaScript. `npm run build` copia i file del sito in `dist/`, la cartella che Cloudflare Pages (build command `npm run build`, output `dist`) pubblica; va bene anche copiare la cartella a mano su qualsiasi hosting.

## Struttura

```
index.html        la pagina: hero, obiettivo 1.001, programma, luogo, edizioni precedenti, modulo di iscrizione, condivisione
privacy.html      bozza dell'informativa privacy (i punti gialli vanno completati)
css/style.css     stile
js/config.js      ← l'unico file da toccare per contatori, limiti e dati evento
js/api.js         strato dati del modulo: parla con la Edge Function Supabase
js/main.js        comportamento: contatori, modulo, .ics, condivisione
supabase/         migrazione SQL e codice della Edge Function (non finiscono online con il sito)
assets/           locandina originale, ritagli usati nel sito, font self-hosted
PRODUCT.md        verità di prodotto (brief del committente, vincoli, testi confermati)
DESIGN.md         sistema visivo registrato dopo la costruzione
```

## Anteprima in locale

```bash
python -m http.server 5198 --directory .
```

poi apri <http://localhost:5198>.

## Come funziona il modulo

Il modulo invia i dati alla Edge Function `bulldogfestival-iscrizioni` del progetto Supabase `mjzjracjadlybvdttgto` ("Rank Ai Mediplan e lobby e labpiattaforma", schema `bulldogfestival`). La funzione:

1. controlla i dati (stesse regole del modulo, più i limiti del database) e ripulisce i simboli che i fogli di calcolo leggono come formule;
2. salva l'iscrizione con un **numero progressivo** (1, 2, 3…, mai riassegnato) e un codice personale per l'accoglienza;
3. segnala i **doppioni per e-mail** (stessa e-mail di un'iscrizione già presente → stato `da_verificare`, non conta nei contatori finché non lo confermi) e accetta al massimo 3 invii all'ora per e-mail;
4. manda la **conferma via Resend** con il testo del committente e restituisce al sito il numero, che compare a schermo;
5. a ogni visita, la stessa funzione dà al sito i **contatori** (iscrizioni, persone, bulldog) delle iscrizioni confermate.

La tabella non è raggiungibile dal browser: nessun ruolo pubblico può leggerla (RLS attiva e nessuna policy), la scrive solo la funzione. Si consulta dal pannello Supabase → Table Editor → schema `bulldogfestival` → `iscrizioni`, che permette anche l'esportazione in CSV. Per correggere o annullare un'iscrizione basta cambiare `stato` (`annullata` la toglie dai contatori; il numero non viene riassegnato).

### Secrets da impostare (Supabase → Edge Functions → Secrets)

| Secret | Serve per | Note |
|---|---|---|
| `BULLDOG_RESEND_FROM` | mittente delle conferme, es. `Gold Lake Garda <iscrizioni@tuodominio.it>` | **Obbligatorio per le e-mail**; il dominio deve essere verificato su Resend. Senza, l'iscrizione si salva e la riga resta `email_stato = non_configurata`. Non usa `RESEND_FROM`, che è di MediPlan. |
| `BULLDOG_RESEND_API_KEY` | chiave Resend dedicata | Facoltativo: se manca si usa `RESEND_API_KEY` (già presente per MediPlan), che deve poter inviare dal dominio del raduno. |
| `BULLDOG_RESEND_REPLY_TO` | dove arrivano le risposte dei partecipanti | Facoltativo. |
| `BULLDOG_ALLOWED_ORIGINS` | restringe il browser al tuo dominio, es. `https://tuodominio.it,https://www.tuodominio.it` | Facoltativo: vuoto = qualsiasi origine. |
| `BULLDOG_SITE_URL` | link al sito nell'e-mail | Facoltativo. |

La colonna `email_stato` dice com'è andato l'invio: `inviata`, `non_configurata` o `errore`.

### Report giornaliero a info@gardawellfit.eu

Ogni giorno alle **06:00 UTC** (07:00 in inverno, 08:00 con l'ora legale) un job di `pg_cron` (`bulldogfestival-report-giornaliero`) chiama la Edge Function `bulldogfestival-report`, che manda a **info@gardawellfit.eu**:

- un riepilogo (iscrizioni confermate, persone, bulldog su 1001, nuove nelle ultime 24 ore, quanti vogliono entrare nel gruppo WhatsApp);
- la sezione **"Da controllare"** con i flag: doppioni da verificare, conferme e-mail non inviate, annullate;
- la tabella di **tutti gli iscritti** con i loro flag (NUOVA, DOPPIONE di…, CONFERMA E-MAIL NON INVIATA, ANNULLATA…; le righe da controllare sono evidenziate), le ultime 150 nel corpo del messaggio;
- il **CSV completo** in allegato (`iscrizioni-AAAA-MM-GG.csv`, separatore `;`, si apre con Excel): tutti i campi, compresi stato, conferma e-mail, WhatsApp, telefono e codice di accoglienza.

Il report parte anche con zero iscrizioni, così si vede che il sistema è vivo. La chiamata del cron è autenticata da un segreto casuale che sta solo nel vault del database (`bulldogfestival_report_secret`): non c'è nessun secret da impostare a mano. Il mittente è lo stesso delle conferme (`BULLDOG_RESEND_FROM`).

- **Cambiare destinatari:** secret facoltativo `BULLDOG_REPORT_TO` su Supabase (indirizzi separati da virgola, al massimo 5); senza, vale `info@gardawellfit.eu`.
- **Cambiare orario:** `select cron.alter_job((select jobid from cron.job where jobname = 'bulldogfestival-report-giornaliero'), schedule := '0 7 * * *');` nell'SQL editor (l'orario è in UTC).
- **Mandarlo subito a mano:** nell'SQL editor, `select net.http_post(url := 'https://mjzjracjadlybvdttgto.supabase.co/functions/v1/bulldogfestival-report', headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'bulldogfestival_report_secret')), body := '{}'::jsonb);`. Per provarlo senza spedire niente a info@ si può passare `'{"dry_run": true}'` o `'{"to": "altro@indirizzo"}'` come body.
- **Vedere se è partito:** `select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;` e, per la risposta della funzione, la tabella `net._http_response`.

Il report contiene dati personali dei partecipanti (nomi, e-mail, telefoni) e viaggia per e-mail: va tenuto tra chi organizza il raduno.

### Ancora da fare (dalla lettera del committente, `assets/src/pdf_testo.txt`)

- **PDF personalizzato con QR code** allegato alla conferma: il codice per il QR c'è già (`codice`), manca generare PDF e immagine.
- **Check-in** il giorno dell'evento (referente arrivato, accompagnatori e bulldog presenti) e conteggio distinto dei presenti.
- **Modifica di un'iscrizione** da parte del partecipante: oggi si corregge dal pannello.
- **QR code generale** verso la pagina delle iscrizioni, da stampare e condividere.
- Per limitare lo spam oltre al limite per e-mail: una regola di rate limiting di Cloudflare sul sito o Turnstile nel modulo.

## Cose da fare prima della pubblicazione

- [ ] **Guinness World Records**: il logo e la dicitura "tentativo ufficiale" non sono nel sito perché la richiesta non è ancora approvata. Il testo dice "puntare al record". Da rivedere con l'organizzazione quando arriva la conferma. (L'e-mail di conferma dice invece "1001 Bulldog Francesi" come nel testo del committente.)
- [ ] Impostare i secrets `BULLDOG_RESEND_FROM` (e gli altri facoltativi) su Supabase: finché manca, il sito salva le iscrizioni ma non manda la conferma.
- [ ] Completare `privacy.html` (titolare, sede, contatti, tempi di conservazione). Fornitori da citare: Supabase (database), Resend (invio e-mail), Cloudflare (hosting).
- [ ] Contatti e social dell'organizzazione (oggi non ci sono).
- [ ] Conferma delle foto delle edizioni precedenti: l'assegnazione al 1° e al 2° raduno è dedotta (vedi `PRODUCT.md`). Per scambiarle basta riordinare i `<figure>` nella sezione `#edizioni` di `index.html`. Mancano anno e luogo del 1° raduno.
- [ ] Liberatoria per le foto: nelle immagini delle edizioni precedenti si riconoscono persone. Serve che l'organizzazione abbia l'informativa/liberatoria foto-video dei raduni e, se vuole, la citi in `privacy.html`.
- [ ] Logo in alta risoluzione: arrivato (oro su bianco, 1536×1024) ma non ancora messo al posto del ritaglio della locandina in barra e footer; serve prima ricavarne una versione con sfondo trasparente.
- [ ] Foto vere per l'hero: oggi l'hero usa ritagli della locandina (1024 px).
- [ ] Dominio e hosting.
- [ ] `og:image` con URL assoluto una volta noto il dominio.

## Provenienza delle immagini

Tutti i file in `assets/img/` sono ritagli di `assets/locandina.jpg`, fornita dal committente (locandina ufficiale dell'evento): `dogs-group` (fascia dei cani), `dog-hero` (bulldog in alto a destra), `castle`, `logo`, `wellfit`, `share` (1200×630 per le anteprime social, senza la zona Guinness). I file `r1-*` e `r2-*` sono foto del 1° e del 2° raduno fornite dal committente (31/10/2026), ritagliate (via bande nere, orari e filigrane) e ridimensionate in due larghezze per `srcset`, senza metadati. `assets/favicon.svg` è disegnata a mano. I font in `assets/fonts/` sono Cinzel, Barlow, Barlow Condensed e Caveat Brush (Google Fonts, licenza SIL OFL).
