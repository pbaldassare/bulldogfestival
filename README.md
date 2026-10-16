# 3° Raduno Nazionale Gold Lake Garda — Bulldog Francese

Sito di una pagina per il raduno di **sabato 25 settembre 2027** al Parco del Castello di Moniga del Garda, con l'obiettivo di riunire 1.001 bulldog francesi.

Statico: HTML, CSS e JavaScript. `npm run build` copia i file del sito in `dist/`, la cartella che Cloudflare Pages (build command `npm run build`, output `dist`) pubblica; va bene anche copiare la cartella a mano su qualsiasi hosting.

## Struttura

```
index.html        la pagina: hero, obiettivo 1.001, programma, luogo, modulo di iscrizione, condivisione
privacy.html      bozza dell'informativa privacy (i punti gialli vanno completati)
css/style.css     stile
js/config.js      ← l'unico file da toccare per contatori, limiti e dati evento
js/api.js         strato dati del modulo (oggi: anteprima, salva solo nel browser)
js/main.js        comportamento: prato delle zampe, contatori, modulo, .ics, condivisione
assets/           locandina originale, ritagli usati nel sito, font self-hosted
PRODUCT.md        verità di prodotto (brief del committente, vincoli, testi confermati)
DESIGN.md         sistema visivo registrato dopo la costruzione
```

## Anteprima in locale

```bash
python -m http.server 5198 --directory .
```

poi apri <http://localhost:5198>.

## Stato: anteprima senza database

Per decisione del 16/10/2026 il modulo è completo lato interfaccia ma **non salva ancora**: `js/api.js` scrive solo nel `localStorage` del visitatore e il numero progressivo ricomincia da 0001 su ogni browser. Finché `preview: true` in `js/config.js`, la pagina mostra l'avviso "Anteprima" sopra il modulo.

Per andare online davvero servono (specifica del committente in `assets/src/pdf_testo.txt`):

1. **Backend** (Supabase o equivalente): tabella iscrizioni con numero progressivo univoco mai riassegnato, nomi dei bulldog, scelta WhatsApp e telefono, stato (attiva / modificata / annullata), controllo doppioni per e-mail, contatori pubblici (iscrizioni, persone, bulldog / 1001).
2. **E-mail di conferma automatica** con PDF personalizzato e QR code personale.
3. **Archivio consultabile** dagli organizzatori (vista/esportazione tipo foglio di calcolo) con possibilità di correggere un'iscrizione.
4. **Check-in** il giorno dell'evento via numero o QR: referente arrivato, accompagnatori e bulldog effettivi.
5. **QR code generale** che porta alla pagina delle iscrizioni, da stampare e condividere.

Quando il backend c'è, si sostituiscono le due funzioni di `js/api.js` (`getCounts`, `submit`) mantenendo la stessa firma e si mette `preview: false`.

## Cose da fare prima della pubblicazione

- [ ] **Guinness World Records**: il logo e la dicitura "tentativo ufficiale" non sono nel sito perché la richiesta non è ancora approvata. Il testo dice "tentare il Guinness World Records". Da rivedere con l'organizzazione quando arriva la conferma.
- [ ] Completare `privacy.html` (titolare, sede, contatti, fornitori, tempi di conservazione).
- [ ] Contatti e social dell'organizzazione (oggi non ci sono).
- [ ] Foto vere e logo in alta risoluzione: oggi le immagini sono ritagli della locandina (1024 px). Da sostituire in `assets/img/`.
- [ ] Dominio e hosting.
- [ ] `og:image` con URL assoluto una volta noto il dominio.

## Provenienza delle immagini

Tutti i file in `assets/img/` sono ritagli di `assets/locandina.jpg`, fornita dal committente (locandina ufficiale dell'evento): `dogs-group` (fascia dei cani), `dog-hero` (bulldog in alto a destra), `castle`, `logo`, `wellfit`, `share` (1200×630 per le anteprime social, senza la zona Guinness). `assets/favicon.svg` è disegnata a mano. I font in `assets/fonts/` sono Cinzel, Barlow, Barlow Condensed e Caveat Brush (Google Fonts, licenza SIL OFL).
