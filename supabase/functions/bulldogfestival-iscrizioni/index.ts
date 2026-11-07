// Supabase Edge Function — iscrizioni al 3° Raduno Nazionale Gold Lake Garda Bulldog Francese.
// Pubblica (verify_jwt = false): la chiama il sito statico.
//   GET  → contatori { iscrizioni, persone, bulldog }
//   POST → registra l'iscrizione, assegna il numero progressivo e invia la conferma con Resend
//
// Secrets (tutti facoltativi: se mancano l'iscrizione si salva comunque e la mail resta "non_configurata"):
//   BULLDOG_RESEND_FROM      mittente, es. "Gold Lake Garda <iscrizioni@tuodominio.it>" (dominio verificato su Resend).
//                            Non usa RESEND_FROM: quello è di MediPlan, nello stesso progetto.
//   BULLDOG_RESEND_API_KEY   chiave Resend dedicata; se manca si usa RESEND_API_KEY
//   BULLDOG_RESEND_REPLY_TO  indirizzo a cui arrivano le risposte dei partecipanti
//   BULLDOG_ALLOWED_ORIGINS  origini del sito separate da virgola (es. https://tuodominio.it,https://www.tuodominio.it);
//                            vuoto = qualsiasi (l'endpoint è pubblico e non usa cookie)
//   BULLDOG_SITE_URL         indirizzo del sito, per il link nell'e-mail

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const EVENTO = {
  titolo: "3° Raduno Nazionale Gold Lake Garda Bulldog Francese",
  data: "sabato 25 settembre 2027",
  luogo: "Parco del Castello – Moniga del Garda",
};

type Dati = {
  referente: string;
  citta: string;
  provincia: string;
  email: string;
  accompagnatori: number;
  bulldog: string[];
  whatsapp: "si" | "no" | "gia";
  telefono: string | null;
};
type Registrazione = { id: string; numero: number; codice: string; doppione_di: number | null };
type EsitoEmail = { stato: "sent" | "not_configured" | "failed"; errore?: string };

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

// ---------- CORS ----------
function corsHeaders(req: Request): Record<string, string> {
  const ammesse = (Deno.env.get("BULLDOG_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const origin = req.headers.get("origin") ?? "";
  let consenti = "*";
  if (ammesse.length) {
    const locale = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    consenti = ammesse.includes(origin) || locale ? origin : ammesse[0];
  }
  return {
    "Access-Control-Allow-Origin": consenti,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const json = (req: Request, status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8", ...extra },
  });

// ---------- Validazione (le stesse regole del modulo, più i limiti del database) ----------
// Niente caratteri di controllo e niente simboli iniziali che Excel e Fogli leggono come formule (= + - @).
function testo(v: unknown, min: number, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[=+\-@]+/, "")
    .trim();
  return s.length >= min && s.length <= max ? s : null;
}

function valida(raw: unknown): { ok: true; dati: Dati } | { ok: false; campi: string[] } {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const campi: string[] = [];

  const referente = testo(b.referente, 3, 120);
  if (!referente) campi.push("referente");

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) campi.push("email");

  let citta = "";
  if (b.citta != null && b.citta !== "") {
    const c = testo(b.citta, 1, 80);
    if (c === null) campi.push("citta");
    else citta = c;
  }

  let provincia = "";
  if (b.provincia != null && b.provincia !== "") {
    if (typeof b.provincia === "string" && /^[A-Za-z]{2}$/.test(b.provincia.trim())) {
      provincia = b.provincia.trim().toUpperCase();
    } else campi.push("provincia");
  }

  const acc = b.accompagnatori;
  if (!Number.isInteger(acc) || (acc as number) < 0 || (acc as number) > 30) campi.push("accompagnatori");

  const nomi: string[] = [];
  if (!Array.isArray(b.bulldog) || b.bulldog.length < 1 || b.bulldog.length > 30) {
    campi.push("bulldog");
  } else {
    for (const n of b.bulldog) {
      const t = testo(n, 1, 60);
      if (t === null) {
        campi.push("bulldog");
        break;
      }
      nomi.push(t);
    }
  }

  const wa = b.whatsapp;
  if (wa !== "si" && wa !== "no" && wa !== "gia") campi.push("whatsapp");

  let telefono: string | null = null;
  if (wa === "si") {
    const t = typeof b.telefono === "string" ? b.telefono.trim() : "";
    if (!/^\+?[0-9 ()./-]{6,24}$/.test(t) || t.replace(/\D/g, "").length < 6) campi.push("telefono");
    else telefono = t;
  }

  if (b.privacy !== true) campi.push("privacy");

  if (campi.length) return { ok: false, campi: [...new Set(campi)] };
  return {
    ok: true,
    dati: {
      referente: referente as string,
      citta,
      provincia,
      email,
      accompagnatori: acc as number,
      bulldog: nomi,
      whatsapp: wa as Dati["whatsapp"],
      telefono,
    },
  };
}

// ---------- E-mail di conferma ----------
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const elenco = (v: string[]) => (v.length < 2 ? (v[0] ?? "") : v.slice(0, -1).join(", ") + " e " + v[v.length - 1]);
const num4 = (n: number) => String(n).padStart(4, "0");

function costruisciEmail(r: Registrazione, d: Dati) {
  const n = num4(r.numero);
  const sito = (Deno.env.get("BULLDOG_SITE_URL") ?? "").trim().replace(/\/$/, "");
  const nomi = elenco(d.bulldog);
  const persone = d.accompagnatori + 1;

  const righe: [string, string][] = [
    ["Referente", d.referente],
    ["Accompagnatori aggiuntivi", String(d.accompagnatori)],
    ["Totale persone", String(persone)],
    ["Bulldog Francesi iscritti", String(d.bulldog.length)],
    [d.bulldog.length === 1 ? "Nome del Bulldog" : "Nomi dei Bulldog", nomi],
  ];

  const note: string[] = [];
  if (r.doppione_di) {
    note.push(
      `Con questo indirizzo e-mail risultava già l'iscrizione n. ${num4(r.doppione_di)}: controlleremo noi che non si tratti di un doppione.`,
    );
  }
  if (d.whatsapp === "si") {
    note.push(
      "Useremo il numero che ci hai indicato solo per invitarti nel gruppo WhatsApp Gold Lake Garda Bulldog Francese.",
    );
  }

  const oggetto = `Conferma di iscrizione n. ${n} — ${EVENTO.titolo}`;

  const trRighe = righe
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 0;color:#3d4b73;font-size:14px;width:46%;vertical-align:top;">${k}</td><td style="padding:7px 0;font-size:15px;font-weight:bold;color:#0e1e4a;vertical-align:top;">${esc(v)}</td></tr>`,
    )
    .join("");
  const htmlNote = note
    .map((t) => `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#3d4b73;">${esc(t)}</p>`)
    .join("");
  const linkSito = sito
    ? `<p style="margin:14px 0 0;font-size:13px;"><a href="${esc(sito)}" style="color:#0e1e4a;">${esc(sito.replace(/^https?:\/\//, ""))}</a></p>`
    : "";

  const html = `<!DOCTYPE html><html lang="it"><body style="margin:0;padding:0;background:#f7f9fc;font-family:Arial,Helvetica,sans-serif;color:#0e1e4a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fc;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border:1px solid #c9e3f5;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0e1e4a;padding:24px;text-align:center;border-bottom:4px solid #d4a72c;">
<div style="font-size:12px;letter-spacing:2px;color:#b8c3e6;text-transform:uppercase;">3° Raduno Nazionale</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;color:#f1d27a;line-height:1.1;margin-top:6px;">GOLD LAKE GARDA</div>
<div style="font-size:13px;letter-spacing:3px;color:#f1d27a;margin-top:6px;">BULLDOG FRANCESE</div>
</td></tr>
<tr><td style="padding:26px 24px 8px;text-align:center;">
<div style="font-size:12px;letter-spacing:2px;color:#3d4b73;text-transform:uppercase;">Conferma di iscrizione</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:bold;color:#0e1e4a;margin-top:4px;">N. ${n}</div>
<div style="margin-top:14px;font-size:16px;font-weight:bold;">📅 ${esc(EVENTO.data.charAt(0).toUpperCase() + EVENTO.data.slice(1))}</div>
<div style="margin-top:4px;font-size:16px;font-weight:bold;">📍 ${esc(EVENTO.luogo)}</div>
</td></tr>
<tr><td style="padding:12px 24px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #c9e3f5;border-bottom:1px solid #c9e3f5;margin:10px 0;">${trRighe}</table>
<p style="margin:12px 0 0;font-size:13px;color:#3d4b73;">Codice per l'accoglienza il giorno dell'evento: <strong style="color:#0e1e4a;letter-spacing:1px;">${esc(r.codice)}</strong></p>${htmlNote}</td></tr>
<tr><td style="padding:22px 24px 6px;text-align:center;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#0e1e4a;">❤ Grazie per esserti unito alla nostra grande famiglia!</div>
<p style="margin:12px 0 0;font-size:15px;line-height:1.55;">La tua iscrizione è stata registrata correttamente! Non vediamo l'ora di incontrarti insieme ai tuoi meravigliosi Bulldog Francesi per vivere una giornata di amicizia, divertimento e condivisione.</p>
<p style="margin:16px 0 0;font-size:14px;font-weight:bold;letter-spacing:1px;color:#9c7314;">INSIEME VERSO IL NOSTRO GRANDE SOGNO: 1001 BULLDOG FRANCESI! 🏆🐶</p>
<p style="margin:16px 0 0;font-size:15px;">A presto!<br><strong>Lo Staff Gold Lake Garda Bulldog Francese</strong></p>
</td></tr>
<tr><td style="padding:16px 24px 22px;text-align:center;border-top:1px solid #c9e3f5;margin-top:16px;">
<div style="font-size:12px;color:#66739a;">Messaggio automatico · Organizzazione: WELLFIT CONCEPT A.S.D.</div>${linkSito}
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    EVENTO.titolo.toUpperCase(),
    `CONFERMA DI ISCRIZIONE N. ${n}`,
    "",
    `📅 ${EVENTO.data.charAt(0).toUpperCase() + EVENTO.data.slice(1)}`,
    `📍 ${EVENTO.luogo}`,
    "",
    ...righe.map(([k, v]) => `${k}: ${v}`),
    "",
    `Codice per l'accoglienza il giorno dell'evento: ${r.codice}`,
    ...note.map((t) => `\n${t}`),
    "",
    "❤ GRAZIE PER ESSERTI UNITO ALLA NOSTRA GRANDE FAMIGLIA!",
    "La tua iscrizione è stata registrata correttamente! Non vediamo l'ora di incontrarti insieme ai tuoi meravigliosi Bulldog Francesi per vivere una giornata di amicizia, divertimento e condivisione.",
    "",
    "INSIEME VERSO IL NOSTRO GRANDE SOGNO: 1001 BULLDOG FRANCESI! 🏆🐶",
    "",
    "A presto!",
    "Lo Staff Gold Lake Garda Bulldog Francese",
    "WELLFIT CONCEPT A.S.D.",
    sito ? `\n${sito}` : "",
  ].join("\n");

  return { oggetto, html, text };
}

// reinvio = true per il reinvio manuale: serve una chiave di idempotenza nuova, altrimenti Resend (che ricorda
// quella dell'invio originale per 24 ore) risponderebbe "già inviata" senza spedire niente.
async function inviaConferma(r: Registrazione, d: Dati, reinvio = false): Promise<EsitoEmail> {
  const chiave = (Deno.env.get("BULLDOG_RESEND_API_KEY") || Deno.env.get("RESEND_API_KEY") || "").trim();
  const mittente = (Deno.env.get("BULLDOG_RESEND_FROM") || "").trim();
  if (!chiave || !mittente) return { stato: "not_configured" };

  const { oggetto, html, text } = costruisciEmail(r, d);
  const rispondiA = (Deno.env.get("BULLDOG_RESEND_REPLY_TO") || "").trim();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chiave}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `bulldog-iscrizione-${r.id}${reinvio ? "-reinvio-" + Date.now() : ""}`,
      },
      body: JSON.stringify({
        from: mittente,
        to: [d.email],
        subject: oggetto,
        html,
        text,
        ...(rispondiA ? { reply_to: rispondiA } : {}),
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) {
      let nome = "";
      let messaggio = "";
      try {
        const corpo = await res.json();
        nome = String(corpo?.name ?? "");
        messaggio = String(corpo?.message ?? "").slice(0, 300);
      } catch { /* risposta non JSON */ }
      // il messaggio resta solo nei log del server: può nominare l'account Resend, non va restituito al browser
      console.error("resend:", res.status, nome, messaggio);
      return { stato: "failed", errore: `resend_${res.status}${nome ? ":" + nome : ""}` };
    }
    return { stato: "sent" };
  } catch (e) {
    console.error("resend:", (e as Error).name);
    return { stato: "failed", errore: `resend_${(e as Error).name}` };
  }
}

// ---------- Reinvio della conferma (solo per chi organizza) ----------
// POST { "reinvia": <numero iscrizione>, "to": "indirizzo" (facoltativo) } con Authorization: Bearer <segreto nel vault,
// lo stesso del report>. Rimanda la conferma all'indirizzo che il partecipante ha scritto nel modulo oppure, se c'è
// "to", a quell'indirizzo (una copia per chi organizza): in quel caso lo stato della conferma del partecipante non cambia.
async function reinviaConferma(
  req: Request,
  supabase: ReturnType<typeof admin>,
  numeroRaw: unknown,
  destinatarioRaw?: unknown,
): Promise<Response> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(req, 401, { error: "unauthorized" });
  const { data: autorizzato, error: errAuth } = await supabase.rpc("bf_report_autorizzato", { p_token: token });
  if (errAuth) {
    console.error("auth:", errAuth.code, errAuth.message);
    return json(req, 500, { error: "server" });
  }
  if (autorizzato !== true) return json(req, 401, { error: "unauthorized" });

  const numero = Number(numeroRaw);
  if (!Number.isInteger(numero) || numero < 1) return json(req, 400, { error: "numero" });
  const { data, error } = await supabase.rpc("bf_iscrizione", { p_numero: numero });
  if (error) {
    console.error("iscrizione:", error.code, error.message);
    return json(req, 500, { error: "server" });
  }
  if (!data) return json(req, 404, { error: "non_trovata" });

  const i = data as Record<string, unknown>;
  const reg: Registrazione = {
    id: String(i.id),
    numero: Number(i.numero),
    codice: String(i.codice),
    doppione_di: i.doppione_di === null ? null : Number(i.doppione_di),
  };
  const dati: Dati = {
    referente: String(i.referente),
    citta: String(i.citta ?? ""),
    provincia: String(i.provincia ?? ""),
    email: String(i.email),
    accompagnatori: Number(i.accompagnatori),
    bulldog: (i.bulldog as string[]) ?? [],
    whatsapp: i.whatsapp as Dati["whatsapp"],
    telefono: i.telefono === null ? null : String(i.telefono),
  };

  let copia = false;
  if (destinatarioRaw !== undefined && destinatarioRaw !== null && destinatarioRaw !== "") {
    const a = typeof destinatarioRaw === "string" ? destinatarioRaw.trim().toLowerCase() : "";
    if (a.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a)) return json(req, 400, { error: "destinatario" });
    dati.email = a;
    copia = true;
  }

  const esito = await inviaConferma(reg, dati, true);
  if (esito.stato === "sent" && !copia) {
    const { error: errSegna } = await supabase.rpc("bf_segna_email", { p_id: reg.id, p_stato: "inviata" });
    if (errSegna) console.error("segna_email:", errSegna.message);
  }
  return json(req, 200, {
    ok: true,
    number: reg.numero,
    copia,
    emailSent: esito.stato === "sent",
    emailStatus: esito.stato,
    ...(esito.errore ? { emailError: esito.errore } : {}),
  });
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });

  const supabase = admin();

  if (req.method === "GET") {
    const { data, error } = await supabase.rpc("bf_contatori");
    if (error) {
      console.error("contatori:", error.code, error.message);
      return json(req, 500, { error: "server" });
    }
    return json(req, 200, data, { "Cache-Control": "public, max-age=30" });
  }

  if (req.method !== "POST") return json(req, 405, { error: "method" });

  const raw = await req.text();
  if (raw.length > 20_000) return json(req, 413, { error: "too_large" });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(req, 400, { error: "json" });
  }

  // reinvio manuale della conferma: richiede il segreto, i partecipanti non passano di qui
  if (body && typeof body === "object" && "reinvia" in body) {
    const b = body as Record<string, unknown>;
    return await reinviaConferma(req, supabase, b.reinvia, b.to);
  }

  const controllo = valida(body);
  if (!controllo.ok) return json(req, 400, { error: "validation", fields: controllo.campi });
  const dati = controllo.dati;

  const { data, error } = await supabase.rpc("bf_registra_iscrizione", {
    p: {
      referente: dati.referente,
      citta: dati.citta,
      provincia: dati.provincia,
      email: dati.email,
      accompagnatori: dati.accompagnatori,
      bulldog: dati.bulldog,
      whatsapp: dati.whatsapp,
      telefono: dati.telefono,
    },
  });
  if (error) {
    if (error.message?.includes("rate_limited")) return json(req, 429, { error: "rate_limited" });
    console.error("registra:", error.code, error.message);
    return json(req, 500, { error: "server" });
  }
  const reg = data as Registrazione;

  const esito = await inviaConferma(reg, dati);
  const statoDb = esito.stato === "sent" ? "inviata" : esito.stato === "not_configured" ? "non_configurata" : "errore";
  const { error: errSegna } = await supabase.rpc("bf_segna_email", { p_id: reg.id, p_stato: statoDb });
  if (errSegna) console.error("segna_email:", errSegna.message);

  return json(req, 200, {
    ok: true,
    number: reg.numero,
    emailSent: esito.stato === "sent",
    emailStatus: esito.stato,
    ...(esito.errore ? { emailError: esito.errore } : {}),
    duplicateOf: reg.doppione_di,
  });
});
