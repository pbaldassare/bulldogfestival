/* Strato dati del modulo: parla con la Edge Function `bulldogfestival-iscrizioni` di Supabase.
     GET  → contatori { iscrizioni, persone, bulldog }
     POST → registra l'iscrizione; risponde { ok, number, emailSent, duplicateOf }
   Gli errori hanno un `code` (validation, rate_limited, network, server) che main.js trasforma in messaggi. */
(function () {
  const CFG = window.BF_CONFIG;

  class ApiError extends Error {
    constructor(code, status) { super(code); this.code = code; this.status = status; }
  }

  window.BF_API = {
    /** Contatori per la sezione obiettivo. Se il server non risponde si usano i numeri di config.js. */
    async getCounts() {
      try {
        const res = await fetch(CFG.api, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('http ' + res.status);
        const c = await res.json();
        return { iscrizioni: +c.iscrizioni || 0, persone: +c.persone || 0, bulldog: +c.bulldog || 0 };
      } catch (e) {
        return Object.assign({}, CFG.counts);
      }
    },

    /** Invia un'iscrizione. Restituisce { number, emailSent, duplicateOf, preview }. */
    async submit(payload) {
      let res;
      try {
        res = await fetch(CFG.api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        throw new ApiError('network', 0);
      }
      let data = null;
      try { data = await res.json(); } catch (e) { /* risposta non JSON */ }
      if (!res.ok || !data || !data.ok) throw new ApiError((data && data.error) || 'server', res.status);
      return { number: data.number, emailSent: !!data.emailSent, duplicateOf: data.duplicateOf || null, preview: false };
    }
  };
})();
