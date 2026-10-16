---
name: Gold Lake Garda — Bulldog Francese
description: Manifesto di festa italiana in blu notte e oro, con il rosso solo per la data e il tricolore come firma.
colors:
  notte: "#0e1e4a"
  notte-profondo: "#091538"
  notte-morbido: "#1a2d63"
  notte-linea: "#2a3f7d"
  oro: "#d4a72c"
  oro-chiaro: "#f1d27a"
  oro-scuro: "#9c7314"
  oro-inchiostro: "#7a5a0e"
  rosso-italia: "#ce1b2b"
  rosso-scuro: "#a3101f"
  verde-tricolore: "#0b8a43"
  cielo: "#e3f1fb"
  cielo-profondo: "#c9e3f5"
  carta: "#f7f9fc"
  bianco: "#ffffff"
  inchiostro: "#0e1e4a"
  inchiostro-2: "#3d4b73"
  inchiostro-3: "#66739a"
  su-notte: "#f6f1e4"
  su-notte-2: "#b8c3e6"
  whatsapp: "#1e9e55"
typography:
  display:
    fontFamily: "Cinzel, 'Times New Roman', serif"
    fontSize: "clamp(2.5rem, 9.5vw, 5.6rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Cinzel, 'Times New Roman', serif"
    fontSize: "clamp(1.7rem, 4.2vw, 2.6rem)"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "0.005em"
  numeral:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "clamp(4.2rem, 17vw, 9rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.35rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.04em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "0.82rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.18em"
  hand:
    fontFamily: "'Caveat Brush', 'Segoe Print', cursive"
    fontSize: "clamp(2rem, 6.5vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 1.05
rounded:
  campo: "8px"
  blocco: "10px"
  pillola: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  lg: "28px"
  sezione: "clamp(40px, 7vw, 80px)"
  gutter: "clamp(16px, 4vw, 40px)"
components:
  button-gold:
    backgroundColor: "{colors.oro}"
    textColor: "{colors.notte}"
    rounded: "{rounded.pillola}"
    padding: "12px 22px"
    height: "48px"
  button-gold-lg:
    backgroundColor: "{colors.oro}"
    textColor: "{colors.notte}"
    rounded: "{rounded.pillola}"
    padding: "14px 28px"
    height: "56px"
  button-navy:
    backgroundColor: "{colors.notte}"
    textColor: "{colors.su-notte}"
    rounded: "{rounded.pillola}"
    padding: "12px 22px"
    height: "48px"
  button-ghost:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.notte}"
    rounded: "{rounded.pillola}"
    padding: "12px 22px"
    height: "48px"
  input:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.inchiostro}"
    rounded: "{rounded.campo}"
    padding: "10px 14px"
    height: "50px"
  choice:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.inchiostro-2}"
    rounded: "{rounded.blocco}"
    padding: "14px 16px"
  choice-checked:
    backgroundColor: "{colors.cielo}"
    textColor: "{colors.notte}"
    rounded: "{rounded.blocco}"
    padding: "14px 16px"
  topbar:
    backgroundColor: "{colors.notte}"
    textColor: "{colors.su-notte}"
    padding: "8px {spacing.gutter}"
---

# Design System: Gold Lake Garda — Bulldog Francese

## Overview

**Creative North Star: "Il manifesto della sagra, stampato in oro"**

Il sistema nasce dalla locandina ufficiale del raduno e la traduce in pagina: un manifesto di festa popolare italiana, pieno e affettuoso, dove ogni blocco forte è dichiarato con materia (pennellata, oro metallico, tricolore) e non con un riquadro. Il blu notte è il fondo su cui l'oro brilla; il cielo chiaro ospita le parti da leggere; il rosso compare solo quando c'è una data o un'urgenza. La pagina non ha card: i contenuti stanno direttamente sul colore della sezione, separati da filetti sottili, pennellate e fasce a tutta larghezza.

La densità è generosa e verticale, pensata per il telefono: una cosa per volta, numeri grandi, pulsanti a pillola alti 48–56 px. Il tono è celebrativo ma onesto: ciò che non esiste ancora (programma, orari) si annuncia come "in arrivo", mai si inventa.

**Key Characteristics:**
- Blu notte e oro metallico come coppia dominante; rosso italiano solo per la data.
- Pennellate strappate (SVG con `feTurbulence`) dietro la data e dietro l'obiettivo 1.001.
- Cinzel 900 in oro per i titoli, Barlow Condensed 800 maiuscolo per numeri e date, Caveat Brush per le frasi dette a voce.
- Nessuna card: sezioni piene, filetti sottili, fasce di colore a tutta larghezza.
- Icone a tratto unico in oro scuro (stroke 1.8–2), mai glifi o emoji.

## Colors

Una tavolozza da manifesto: pochi colori saturi, ciascuno con un compito preciso.

### Primary
- **Blu Notte** (`{colors.notte}`): fondo delle sezioni forti (obiettivo, testata iscrizione, barra in alto), colore del testo su fondi chiari, pulsante secondario pieno. Variante **Notte Profondo** per il footer, **Notte Morbido** per gli hover, **Notte Linea** per filetti e riga di avanzamento su blu.
- **Oro** (`{colors.oro}`): pulsante principale (gradiente chiaro→oro→scuro), filetto di sezione da 6 px, icone (Oro Scuro). **Oro Chiaro** è il colore dei titoli su blu e delle cifre principali; **Oro Inchiostro** è l'ombra che dà rilievo alle lettere dorate.

### Secondary
- **Rosso Italia** (`{colors.rosso-italia}`): la banda della data, la sottolineatura a pennello delle frasi a mano, il cuore, l'asterisco dei campi obbligatori, . **Rosso Scuro** per i messaggi d'errore.
- **Verde Tricolore** (`{colors.verde-tricolore}`): solo nel filetto tricolore e nel pulsante WhatsApp (variante `{colors.whatsapp}`).

### Neutral
- **Cielo** (`{colors.cielo}`) e **Cielo Profondo**: fondo dell'hero (radiale bianco→cielo→cielo profondo), della sezione luogo, dei riquadri di aiuto nel modulo, e dei filetti (1 px) tra le voci.
- **Carta** (`{colors.carta}`): fondo della sezione iscrizione, dove il modulo poggia senza riquadro.
- **Inchiostro** (= Blu Notte) per i titoli e le etichette; **Inchiostro 2** per il corpo del testo su chiaro; **Inchiostro 3** per aiuti e placeholder (≥4.5:1 su bianco).
- **Su Notte** (bianco caldo) e **Su Notte 2** (azzurro chiaro) per testo primario e secondario sul blu: mai grigio su blu.

### Named Rules
**The Red Is a Date Rule.** Il rosso pieno appare su una superficie solo quando porta una data o un'urgenza (banda della data, errori, asterisco). Mai come colore di sezione o di pulsante.
**The Gold Speaks Rule.** L'oro non riempie regioni: è lettera, filetto, zampa, pulsante. La regione la riempie il blu notte.
**The Tinted Secondary Rule.** Il testo secondario prende il colore della superficie: Su Notte 2 sul blu, Inchiostro 2/3 sul chiaro. Niente grigi neutri.

## Typography

**Display Font:** Cinzel (900 per i titoli, 700 per il nome nella barra), self-hosted in `assets/fonts/`.
**Numerals / Labels Font:** Barlow Condensed (800 per date, numeri e titoli di sezione del modulo; 600 per le etichette spaziate).
**Body Font:** Barlow (400/500/600).
**Voice Font:** Caveat Brush (400), solo per frasi dette a voce ("Insieme possiamo scrivere la storia!", "Restate sintonizzati!").

**Character:** l'inscrizione romana dell'oro (Cinzel) contro la cartellonistica condensata della data (Barlow Condensed): solennità e sagra nello stesso manifesto. Barlow lega tutto senza farsi notare.

### Hierarchy
- **Display** (Cinzel 900, `clamp(2.5rem, 9.5vw, 5.6rem)`, 1): il nome dell'evento nell'hero, in oro metallico con doppia ombra (`drop-shadow(0 2px 0 oro-inchiostro)` + ombra blu morbida). L'ordinale "3°" usa lo stesso trattamento a 1.9em dell'edizione.
- **Headline** (Cinzel 900, `clamp(1.7rem, 4.2vw, 2.6rem)`, 1.08): titoli di sezione; blu notte su chiaro, Oro Chiaro con ombra scura su blu.
- **Numeral** (Barlow Condensed 800, `clamp(4.2rem, 17vw, 9rem)`, .95): il 1.001 nel blocco d'oro e la data (`clamp(2rem, 7.5vw, 4rem)`); contatori a `clamp(3.4rem, 13vw, 6rem)` e `clamp(2rem, 6vw, 2.8rem)`, sempre `font-variant-numeric: tabular-nums`.
- **Title** (Barlow Condensed 800, 1.35rem, 1.15, maiuscolo, tracking .04em): titoli delle sei aree e dei gruppi del modulo.
- **Body** (Barlow 400, 1.0625rem, 1.55): misura massima 68ch; i paragrafi guida 1.125rem.
- **Label** (Barlow Condensed 600, .82rem, tracking .18em, maiuscolo): didascalie sotto i numeri, legenda, etichetta totale persone. Stanno **sotto** o **accanto** al valore, mai sopra un titolo come occhiello.
- **Hand** (Caveat Brush, `clamp(2rem, 6.5vw, 3.4rem)`): Oro Chiaro su blu con sottolineatura rossa inclinata (−1°); rossa su chiaro.

### Named Rules
**The Uppercase Is Condensed Rule.** Tutto ciò che è maiuscolo e spaziato è Barlow Condensed; Cinzel è maiuscolo per natura e non si spazia oltre .12em.
**The Metallic Lettering Rule.** Il gradiente sul testo è ammesso solo per le lettere d'oro del lockup (nome, ordinale, razza), perché è il materiale della locandina. Nessun altro testo ha gradiente.

## Layout

Una sola colonna centrata: contenitore da 980 px per le sezioni di racconto, 760 px per modulo e condivisione, gutter `clamp(16px, 4vw, 40px)`. Le sezioni alternano fondi pieni (cielo → blu → bianco → cielo → blu/carta → oro → blu profondo) e si separano con fasce a tutta larghezza, non con margini bianchi: la fascia dei cani entra nel blu con una sfumatura, la testata dell'iscrizione è un blocco blu a tutta larghezza (`margin: 0 calc(50% - 50vw)`) chiuso da un filetto d'oro di 6 px.

Ritmo verticale: `clamp(40px, 7vw, 80px)` sopra e sotto ogni sezione; 26–30 px tra gruppi; 12–16 px tra campi; più spazio sopra un titolo che sotto. Breakpoint: 640 px (righe del modulo a due colonne, contatori in linea), 820 px (programma a due colonne, luogo immagine+testo, footer a tre colonne), 1100 px (il medaglione del bulldog diventa un cammeo ad arco da 230 px a destra del titolo, che emerge dalla fascia dei cani). La barra in alto è `position: sticky` (ancoraggi con `scroll-margin-top: 84px`).


## Elevation & Depth

Depth viene dalla materia, non dalle card: lettere con ombra portata, pennellate con bordi strappati, pulsanti con `inset 0 1px 0 rgba(255,255,255,.55)` che simula il bordo lucido dell'oro. Le superfici di sezione sono piatte; le ombre compaiono su ciò che "poggia" sulla pagina.

### Shadow Vocabulary
- **Lettere d'oro** (`drop-shadow(0 2px 0 #7a5a0e) drop-shadow(0 6px 10px rgba(14,30,74,.25))`): rilievo del lockup.
- **Pulsante oro** (`0 6px 16px -6px rgba(156,115,20,.6)`, hover `0 12px 24px -8px rgba(156,115,20,.7)` + `translateY(-2px)`): l'unico elemento che si solleva.
- **Banda rossa** (`drop-shadow(0 10px 18px rgba(206,27,43,.35))`): la data galleggia sul cielo.
- **Foto incorniciata** (`0 14px 34px -12px rgba(14,30,74,.35)`): la polaroid del castello, bordo bianco 8 px, ruotata −2°.
- **Barra in alto scrollata** (`0 8px 24px -10px rgba(0,0,0,.6)`).

### Named Rules
**The No Card Rule.** Nessun contenuto vive in un rettangolo bianco ombreggiato: modulo, contatori, successo e voci del programma stanno sul colore della sezione, separati da filetti di 1 px (`cielo-profondo` su chiaro, `notte-linea` su blu).
**The Brush Not Box Rule.** Un blocco che deve urlare (data, obiettivo) sta su una pennellata SVG ruotata di 1–1.5°, mai su un rettangolo.

## Shapes

Pillole per i pulsanti (999 px), campi con angoli da 8 px e bordo 2 px (`#b9c5e2`, blu notte al focus), scelte e riquadri di aiuto a 10 px. Le pennellate sono forme organiche generate con `feTurbulence` + `feDisplacementMap` (scale 18–20). Il ritratto del bulldog nell'hero è un medaglione rotondo con anello Oro Chiaro da 4 px (84 px sul telefono, 120 px sul tablet) poggiato sul bordo alto della fascia dei cani; dai 1100 px diventa un cammeo ad arco (raggio 115 px in alto, 8 px in basso, anello 5 px). Il filetto tricolore è una barra 120×6 px con tre campi netti. Le icone sono SVG a tratto unico, 32 px, stroke 1.8, terminazioni e giunzioni arrotondate; il simbolo zampa è un `<symbol>` riusato (campi dei bulldog, successo).

## Components

### Buttons
- **Shape:** pillola (999 px), min-height 48 px (56 px la taglia grande), font Barlow 600.
- **Oro (primario):** gradiente verticale oro chiaro→oro→oro scuro, testo blu notte con `text-shadow` bianco, bordo oro scuro; hover si alza di 2 px. È l'unica azione dorata per sezione.
- **Navy:** fondo blu notte, testo Su Notte; hover Notte Morbido. Azioni secondarie su chiaro.
- **Ghost:** bordo blu notte 2 px, fondo bianco semitrasparente; hover bianco pieno. **Ghost-navy** trasparente con bordo blu su chiaro.
- **WhatsApp:** verde `{colors.whatsapp}` con icona a tratto, solo per la condivisione.
- **Stati:** `:disabled` opacità .7 e cursore `progress`; `.is-busy` mostra uno spinner da 18 px dentro il pulsante; focus ring oro 3 px con offset 3 px ovunque.

### Inputs / Fields
- **Style:** 50 px di altezza, bordo 2 px `#b9c5e2`, raggio 8 px, Barlow 500 1.0625rem, caret oro scuro, placeholder Inchiostro 3.
- **Focus:** bordo blu notte + alone `0 0 0 4px rgba(212,167,44,.35)`.
- **Errore:** bordo rosso, messaggio Rosso Scuro 600 sotto il campo, riepilogo in alto con link ai campi; l'errore sparisce al primo input.
- **Stepper:** griglia 50px/1fr/50px, tasti −/+ su Cielo, input centrale senza spinner nativi.

### Choices (radio e checkbox)
- Riga intera cliccabile con bordo 2 px, raggio 10 px; il controllo è un cerchio (radio) o quadrato 6 px (checkbox) di 26 px blu notte che si riempie di blu con spunta Oro Chiaro; la riga selezionata diventa Cielo con bordo blu.

### Navigation
- Barra sticky blu notte con filetto d'oro 3 px: logo 50–56 px, nome in Cinzel 700 Oro Chiaro con sottotitolo Barlow Condensed spaziato, pulsante oro piccolo "Iscriviti" a destra. Ombra solo dopo 12 px di scroll.

### Date Band (signature)
- Pennellata rossa SVG ruotata −1.5°, icona calendario a tratto, "Sabato" spaziato sopra la data in Barlow Condensed 800; ombra rossa morbida. È l'elemento che dice "quando" ovunque appaia.

### Gold Goal Block (signature)
- Pennellata d'oro (gradiente orizzontale) ruotata +1.2° con "OBIETTIVO" spaziato e il numero 1.001 in blu profondo; sotto, il nome della cosa in condensato bianco.

### Counters
- Cifre nude in Barlow Condensed 800 con la didascalia Label **sotto**; il contatore principale in Oro Chiaro con "/ 1.001" a .42em e una riga d'avanzamento di 4 px (oro per la percentuale, Notte Linea il resto).

## Do's and Don'ts

### Do:
- **Do** mettere ogni azione principale in un solo pulsante oro per sezione, e le secondarie in navy o ghost.
- **Do** usare le pennellate SVG per data e obiettivo, ruotate di 1–1.5°, con bordi strappati da `feTurbulence`.
- **Do** tenere i titoli in Cinzel 900 (oro su blu, blu su chiaro) e tutto ciò che è maiuscolo e spaziato in Barlow Condensed.
- **Do** separare i contenuti con filetti di 1 px e fasce di colore a tutta larghezza; il modulo poggia sulla carta.
- **Do** colorare il testo secondario dalla superficie (Su Notte 2 sul blu, Inchiostro 2/3 sul chiaro) e tenere i placeholder a Inchiostro 3.
- **Do** disegnare le icone a tratto unico in oro scuro e usare il `<symbol id="paw">` per ogni zampa.

### Don't:
- **Don't** mettere contenuti in card bianche ombreggiate, né contatori in scatole: niente "hero-metric" con numero grande in un riquadro.
- **Don't** usare il rosso per sezioni o pulsanti: solo date, errori e obbligatori.
- **Don't** mettere etichette piccole e spaziate sopra un titolo (occhielli): la didascalia va sotto il valore.
- **Don't** usare gradiente sul testo fuori dal lockup d'oro dell'hero.
- **Don't** usare emoji o glifi Unicode come icone, né font di sistema per i titoli.
- **Don't** mostrare il marchio Guinness World Records o la dicitura "tentativo ufficiale" finché la licenza non è confermata (vincolo di prodotto, non scelta visiva).
