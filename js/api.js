/* Strato dati del modulo. Oggi è una versione di anteprima che salva solo nel
   browser di chi compila (localStorage): nessun invio al server, nessuna
   e-mail. Quando il backend (Supabase) sarà pronto, basta sostituire le due
   funzioni qui sotto mantenendo la stessa firma. */
(function () {
  const KEY = 'bf_iscrizioni_anteprima';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }

  window.BF_API = {
    /** Contatori per la sezione obiettivo. In anteprima arrivano da config.js. */
    async getCounts() {
      return Object.assign({}, window.BF_CONFIG.counts);
    },

    /**
     * Invia un'iscrizione. Restituisce { number, emailSent, preview }.
     * In anteprima il numero è solo locale e ricomincia da 1 su ogni browser.
     */
    async submit(payload) {
      await new Promise(r => setTimeout(r, 650));
      const list = read();
      const number = list.length + 1;
      list.push(Object.assign({ number, created_at: new Date().toISOString() }, payload));
      try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* storage non disponibile: va bene lo stesso */ }
      return { number, emailSent: false, preview: true };
    }
  };
})();
