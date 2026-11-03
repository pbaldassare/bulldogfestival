/* Impostazioni del sito: l'unico file da toccare per numeri, limiti e dati evento. */
window.BF_CONFIG = {
  // true solo se le iscrizioni NON vengono salvate (mostra l'avviso "Anteprima" sopra il modulo).
  preview: false,

  // Edge Function Supabase che riceve le iscrizioni, assegna il numero progressivo,
  // manda la conferma via Resend e restituisce i contatori (codice in supabase/functions/).
  api: 'https://mjzjracjadlybvdttgto.supabase.co/functions/v1/bulldogfestival-iscrizioni',

  // Contatori mostrati nella sezione "Obiettivo 1.001" solo se il server non risponde.
  counts: { iscrizioni: 0, persone: 0, bulldog: 0 },
  goal: 1001,

  // Limiti del modulo (gli stessi del database)
  maxBulldog: 30,
  maxAccompagnatori: 30,

  // Evento
  event: {
    title: '3° Raduno Nazionale Gold Lake Garda — Bulldog Francese',
    date: '20270925',           // AAAAMMGG, evento di un giorno intero
    location: 'Parco del Castello, Moniga del Garda (BS)',
    description: 'Obiettivo 1.001 bulldog francesi insieme. Iscrizioni e informazioni sul sito.'
  }
};
