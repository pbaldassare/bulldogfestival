/* Impostazioni del sito. Questo è l'unico file da toccare per aggiornare
   numeri e link finché il modulo non è collegato al database. */
window.BF_CONFIG = {
  // true finché le iscrizioni non vengono salvate davvero (mostra l'avviso "Anteprima").
  preview: true,

  // Contatori mostrati nella sezione "Obiettivo 1.001". Aggiornarli a mano
  // finché non arrivano dal database.
  counts: { iscrizioni: 0, persone: 0, bulldog: 0 },
  goal: 1001,

  // Limiti del modulo
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
