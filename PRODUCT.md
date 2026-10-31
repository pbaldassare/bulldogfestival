# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS/JS (scelta dell'utente, 16/10/2026): una pagina, nessun build step, pubblicabile su qualsiasi hosting statico. Dominio e hosting non ancora decisi.

## Users

Proprietari di bulldog francesi in Italia (famiglie, coppie, singoli affezionati al cane), che arrivano quasi sempre dal telefono tramite Instagram, Facebook o WhatsApp dopo aver visto la locandina. Sono emotivamente coinvolti, cercano una cosa sola: la data, il posto e come partecipare. Secondario: allevatori, espositori e sponsor che valutano se esserci.

## Product Purpose

Sito del 3° Raduno Nazionale "Gold Lake Garda" Bulldog Francese, sabato 25 settembre 2027 a Moniga del Garda (BS), Lago di Garda. Oggi il sito serve a far segnare la data e a raccogliere pre-iscrizioni dei bulldog che partecipano, da mostrare come avanzamento verso l'obiettivo di 1.001 bulldog francesi riuniti nello stesso posto. Successo: la persona capisce in pochi secondi cos'è, quando e dove, e lascia la pre-iscrizione o il contatto.

## Positioning

L'unico evento italiano che punta a riunire 1.001 bulldog francesi in un giorno solo, sul Lago di Garda, con un obiettivo numerico da record. "Insieme possiamo scrivere la storia!" è la frase emotiva confermata.

## Operating Context

- Terza edizione: ne esistono due precedenti, ma non c'è materiale (foto, numeri) su di esse.
- Organizza Wellfit Concept ASD ("Change Your Life"). Il committente scrive a Paolo (chi sviluppa) tramite la lettera `assets/src/pdf_testo.txt` (dal PDF "GOLD LAKE GARDA BULLDOG.pdf"), che è la specifica del modulo di iscrizione.
- Luogo confermato dalla lettera: **Parco del Castello di Moniga del Garda**.
- Programma e orari: non ancora definiti. La locandina dice "Nei prossimi mesi vi daremo tutte le informazioni su programma, iscrizioni e novità".
- Sei aree annunciate: Incontri e condivisione; Consigli e informazione; Salute e benessere animale; Espositori e area shop; Foto e video; Intrattenimento e tante sorprese.
- Esiste un gruppo WhatsApp "Gold Lake Garda Bulldog Francese", parte importante della comunità; l'adesione è facoltativa e separata dall'iscrizione.
- Traffico quasi tutto mobile da Facebook, Instagram e WhatsApp; previsto un QR code generale che porta alla pagina delle iscrizioni.

## Capabilities and Constraints

- Iscrizione (gratuita, un modulo = un gruppo): confermata come funzione centrale. Specifica della lettera:
  - Referente dell'iscrizione (non per forza il proprietario): nome e cognome (obbl.), città e provincia, e-mail (obbl.), numero di accompagnatori aggiuntivi, totale persone calcolato (accompagnatori + 1).
  - Bulldog: numero totale e nome di ciascuno, con campi che si aggiungono da soli.
  - WhatsApp: una sola scelta tra SÌ (compare il campo cellulare, obbligatorio, con l'avviso che il numero sarà visibile agli altri membri) / NO / SONO GIÀ INSERITO. Mai obbligatorio per partecipare.
  - Privacy: informativa con presa visione obbligatoria; la scelta WhatsApp è separata.
  - Dopo l'invio: messaggio a schermo "ISCRIZIONE REGISTRATA CON SUCCESSO!" con il testo della lettera; numero progressivo univoco (ISCRIZIONE N. 0001…), mai riassegnato; e-mail di conferma automatica personalizzata con PDF e QR code personale.
  - Archivio consultabile (Google Sheets/Excel o equivalente) con stato iscrizione (attiva/modificata/annullata) e stato e-mail; controllo doppioni per e-mail; contatori separati: iscrizioni, persone, bulldog / 1001; check-in il giorno dell'evento (referente arrivato, accompagnatori e bulldog effettivi).
- Stato al 16/10/2026: per decisione dell'utente il sito nasce SENZA database. Il modulo è completo lato interfaccia ma non salva; numero progressivo, e-mail, archivio, contatori reali e check-in richiedono il collegamento a un backend (Supabase) come passo successivo. I contatori mostrano valori impostati a mano in `js/config.js`.
- Nessun pagamento, nessun programma: non inventarli.
- **Guinness World Records:** la richiesta NON è approvata. Non usare il logo Guinness né la dicitura "tentativo ufficiale Guinness World Records" finché l'organizzazione non conferma la licenza. Si può dire "obiettivo 1.001 bulldog francesi" e "puntiamo al record".
- Lingua: italiano.
- Contatti, social, email, telefono: non disponibili. Lasciare punti di aggancio chiari da compilare.

## Brand Commitments

- Nome: "Gold Lake Garda — Bulldog Francese" (il logo mostra un bulldog dorato di profilo con la scritta a due righe e il tricolore).
- La locandina (`assets/locandina.jpg`) è l'unico riferimento visivo confermato: oro metallico + blu notte come base, rosso italiano per la data, tricolore come firma, pennellate dietro i blocchi forti, corona, zampa, cuore disegnato a mano, scrittura a pennello per le frasi emotive. Tono di festa popolare italiana: pieno, celebrativo, affettuoso.
- Payoff organizzatore: "Wellfit Concept ASD — Change Your Life".

## Evidence on Hand

- `assets/locandina.jpg` (1024×1536, probabilmente generata con l'AI) e il PDF di origine: fonte delle immagini dell'hero, del logo e del castello nella sezione Luogo. Nessun logo vettoriale.
- Foto reali delle edizioni precedenti, fornite dal committente il 31/10/2026 e pubblicate nella sezione "Le edizioni precedenti": 3 del 1° raduno (foto di gruppo, pubblico seduto, coppia con due bulldog in passeggiata) e 3 del 2° raduno (gruppo sotto il castello, uomo con microfono e bulldog con medaglia sul palco, ritratto con bulldog). **L'assegnazione ai due raduni è dedotta** (2° = sole, castello e magliette "Secondo raduno nazionale", confermato dal telegiornale in diretta "2° raduno... da Moniga del Garda"; 1° = parco autunnale), non dichiarata dal committente. Nessuna data, luogo o numero dei partecipanti delle due edizioni è confermato: non scriverli.
- Logo oro "GOLD LAKE GARDA — il raduno italiano dei bulldog francesi" in alta risoluzione (1536×1024, oro su bianco), fornito il 31/10/2026 ma non ancora usato nel sito.
- Testi confermati dal committente (lettera): presentazione del gruppo WhatsApp, messaggio di successo, testo della conferma e-mail, frasi "INSIEME VERSO IL NOSTRO GRANDE SOGNO: 1001 BULLDOG FRANCESI!" e "INSIEME POSSIAMO REALIZZARE UN SOGNO STRAORDINARIO".
- Nessuna testimonianza e nessun partner confermato: non fabbricarli. Sulle edizioni precedenti esistono solo le foto elencate sopra.

## Product Principles

1. Prima la data e il posto: chi arriva dal telefono deve poterli leggere senza scorrere.
2. L'obiettivo 1.001 è il motore emotivo del sito: va mostrato come qualcosa a cui partecipare, non come uno slogan.
3. Dire solo ciò che è vero oggi; ciò che non c'è ancora si annuncia come "in arrivo", non si inventa.
4. Un'azione sola per sezione: pre-iscriviti, salva la data, resta aggiornato.
5. Tutto deve essere sostituibile quando arrivano foto vere, logo, contatti e conferma Guinness.
