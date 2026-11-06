// Supabase Edge Function — report giornaliero delle iscrizioni al 3° Raduno Gold Lake Garda.
// Lo chiama pg_cron ogni giorno (job `bulldogfestival-report-giornaliero`) con
//   Authorization: Bearer <segreto nel vault del database>
// e manda a info@gardawellfit.eu un'e-mail con riepilogo, segnalazioni ("flag") ed elenco di tutti gli
// iscritti, più il CSV completo in allegato (si apre con Excel).
// Corpo JSON facoltativo, solo per le prove: { "to": "indirizzo", "dry_run": true }
//
// Usa gli stessi secrets della funzione delle iscrizioni: BULLDOG_RESEND_FROM, BULLDOG_RESEND_API_KEY
// (o RESEND_API_KEY) e BULLDOG_RESEND_REPLY_TO. In più, facoltativo: BULLDOG_REPORT_TO con i destinatari
// separati da virgola (di default info@gardawellfit.eu).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const DESTINATARI_DI_DEFAULT = "info@gardawellfit.eu";
const OBIETTIVO = 1001;
const MAX_RIGHE_NEL_CORPO = 150;

type Riga = {
  numero: number;
  creata: string;
  nuova: boolean;
  referente: string;
  citta: string | null;
  provincia: string | null;
  email: string;
  accompagnatori: number;
  persone: number;
  n_bulldog: number;
  bulldog: string[];
  whatsapp: "si" | "no" | "gia";
  telefono: string | null;
  stato: "attiva" | "da_verificare" | "modificata" | "annullata";
  doppione_di: number | null;
  email_stato: "da_inviare" | "inviata" | "non_configurata" | "errore";
  email_inviata: string | null;
  codice: string;
};

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const num4 = (n: number) => String(n).padStart(4, "0");
const elencoNumeri = (v: Riga[]) =>
  v.slice(0, 30).map((r) => num4(r.numero)).join(", ") + (v.length > 30 ? `, … (+${v.length - 30})` : "");

// ---------- Flag ----------
const confermata = (r: Riga) => r.stato === "attiva" || r.stato === "modificata";
const mailDaControllare = (r: Riga) => r.stato !== "annullata" && r.email_stato !== "inviata";

const WA: Record<Riga["whatsapp"], string> = { si: "Sì, vuole entrare", no: "No", gia: "Già nel gruppo" };
const STATO: Record<Riga["stato"], string> = {
  attiva: "Attiva",
  da_verificare: "Da verificare (doppione)",
  modificata: "Modificata",
  annullata: "Annullata",
};
const MAIL: Record<Riga["email_stato"], string> = {
  inviata: "Inviata",
  errore: "Errore: non inviata",
  non_configurata: "Non configurata: non inviata",
  da_inviare: "Da inviare",
};

// grave = va guardata da un organizzatore
function flagDi(r: Riga): { testo: string; grave: boolean }[] {
  const f: { testo: string; grave: boolean }[] = [];
  if (r.nuova) f.push({ testo: "NUOVA", grave: false });
  if (r.stato === "da_verificare") {
    f.push({ testo: r.doppione_di ? `DOPPIONE di ${num4(r.doppione_di)}` : "DA VERIFICARE", grave: true });
  }
  if (r.stato === "annullata") f.push({ testo: "ANNULLATA", grave: true });
  if (r.stato === "modificata") f.push({ testo: "MODIFICATA", grave: false });
  if (mailDaControllare(r)) {
    f.push({
      testo: r.email_stato === "errore"
        ? "CONFERMA E-MAIL NON INVIATA"
        : r.email_stato === "non_configurata"
        ? "E-MAIL NON CONFIGURATA"
        : "CONFERMA DA INVIARE",
      grave: true,
    });
  }
  return f;
}

function riepilogo(righe: Riga[]) {
  const ok = righe.filter(confermata);
  const nuoveOk = ok.filter((r) => r.nuova);
  return {
    iscrizioni: ok.length,
    persone: ok.reduce((s, r) => s + r.persone, 0),
    bulldog: ok.reduce((s, r) => s + r.n_bulldog, 0),
    nuove: righe.filter((r) => r.nuova),
    nuoveBulldog: nuoveOk.reduce((s, r) => s + r.n_bulldog, 0),
    doppioni: righe.filter((r) => r.stato === "da_verificare"),
    mailKo: righe.filter(mailDaControllare),
    annullate: righe.filter((r) => r.stato === "annullata"),
    whatsapp: ok.filter((r) => r.whatsapp === "si"),
    daControllare: righe.filter((r) => flagDi(r).some((x) => x.grave)).length,
  };
}

// ---------- CSV ----------
const COLONNE = [
  "Numero", "Data iscrizione", "Referente", "Città", "Provincia", "E-mail", "Accompagnatori", "Totale persone",
  "N. bulldog", "Nomi bulldog", "WhatsApp", "Telefono WhatsApp", "Stato", "Doppione di", "Conferma e-mail",
  "Conferma inviata il", "Codice accoglienza",
];

// Le celle di testo che iniziano con = + - @ vengono prefissate con ' perché Excel non le legga come formule.
function cella(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function costruisciCsv(righe: Riga[]): string {
  const linee = righe.map((r) =>
    [
      num4(r.numero), r.creata, r.referente, r.citta, r.provincia, r.email, r.accompagnatori, r.persone,
      // il telefono è già validato alla registrazione (solo cifre e + ( ) . / - e spazi): niente formule possibili.
      // Lo spazio iniziale evita che Excel legga "+39..." come una formula.
      r.n_bulldog, r.bulldog.join(" | "), WA[r.whatsapp], r.telefono ? " " + r.telefono : "", STATO[r.stato],
      r.doppione_di ? num4(r.doppione_di) : "", MAIL[r.email_stato], r.email_inviata, r.codice,
    ].map(cella).join(";")
  );
  // BOM + separatore ; + CRLF: Excel in italiano lo apre senza importazione guidata
  return "﻿" + [COLONNE.map(cella).join(";"), ...linee].join("\r\n") + "\r\n";
}

// ---------- E-mail ----------
function costruisciEmail(righe: Riga[], oggi: string) {
  const s = riepilogo(righe);
  const perc = Math.round((s.bulldog / OBIETTIVO) * 1000) / 10;

  const oggetto =
    `Report iscrizioni ${oggi}: ${s.iscrizioni} iscrizioni · ${s.persone} persone · ${s.bulldog} bulldog` +
    (s.daControllare ? ` · ${s.daControllare} da controllare` : "");

  const riga = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#3d4b73;font-size:14px;width:55%;">${k}</td><td style="padding:6px 0;font-size:15px;font-weight:bold;color:#0e1e4a;">${v}</td></tr>`;

  const segnalazioni: [string, Riga[], string][] = [
    ["Doppioni da verificare (stessa e-mail di un'iscrizione già presente: non contano nei totali finché non li confermi)", s.doppioni, "#a3101f"],
    ["Conferma e-mail non inviata (scrivi tu al partecipante)", s.mailKo, "#a3101f"],
    ["Annullate", s.annullate, "#66739a"],
  ];
  const htmlSegnalazioni = segnalazioni.filter(([, v]) => v.length).map(([t, v, c]) =>
    `<p style="margin:10px 0 0;font-size:13px;line-height:1.5;"><strong style="color:${c};">${esc(t)} — ${v.length}:</strong> n. ${esc(elencoNumeri(v))}</p>`
  ).join("") || `<p style="margin:10px 0 0;font-size:13px;color:#3d4b73;">Niente da controllare.</p>`;

  const th = (t: string) =>
    `<th align="left" style="padding:6px 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#3d4b73;border-bottom:2px solid #d4a72c;">${t}</th>`;
  const td = (c: string, extra = "") =>
    `<td style="padding:7px 8px;border-bottom:1px solid #e3f1fb;font-size:12px;line-height:1.4;vertical-align:top;${extra}">${c}</td>`;

  const ordinate = [...righe].sort((a, b) => b.numero - a.numero); // dalla più recente
  const mostrate = ordinate.slice(0, MAX_RIGHE_NEL_CORPO);
  const trRighe = mostrate.map((r) => {
    const luogo = [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ");
    const flag = flagDi(r).map((x) =>
      `<span style="display:block;font-weight:bold;color:${x.grave ? "#a3101f" : "#9c7314"};">${esc(x.testo)}</span>`
    ).join("");
    return `<tr style="${flagDi(r).some((x) => x.grave) ? "background:#fff7dd;" : ""}">` +
      td(num4(r.numero), "font-weight:bold;") +
      td(`${esc(r.referente)}${luogo ? `<br><span style="color:#66739a;">${esc(luogo)}</span>` : ""}<br><span style="color:#66739a;">${esc(r.creata)}</span>`) +
      td(`${esc(r.email)}${r.telefono ? `<br>${esc(r.telefono)}` : ""}`) +
      td(String(r.persone), "text-align:center;") +
      td(`${r.n_bulldog} · ${esc(r.bulldog.join(", "))}`) +
      td(esc(WA[r.whatsapp])) +
      td(flag || `<span style="color:#66739a;">—</span>`) +
      `</tr>`;
  }).join("");

  const tabella = righe.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;"><tr>${
      ["N.", "Referente", "E-mail · telefono", "Pers.", "Bulldog", "WhatsApp", "Flag"].map(th).join("")
    }</tr>${trRighe}</table>` +
      (righe.length > mostrate.length
        ? `<p style="margin:10px 0 0;font-size:12px;color:#66739a;">Mostrate le ultime ${mostrate.length} iscrizioni su ${righe.length}: l'elenco completo è nel CSV allegato.</p>`
        : "")
    : `<p style="margin:10px 0 0;font-size:14px;color:#3d4b73;">Nessuna iscrizione ricevuta finora.</p>`;

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#f7f9fc;font-family:Arial,Helvetica,sans-serif;color:#0e1e4a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fc;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#ffffff;border:1px solid #c9e3f5;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0e1e4a;padding:22px 24px;text-align:center;border-bottom:4px solid #d4a72c;">
<div style="font-size:12px;letter-spacing:2px;color:#b8c3e6;text-transform:uppercase;">3° Raduno Nazionale · Report iscrizioni del ${esc(oggi)}</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;color:#f1d27a;line-height:1.1;margin-top:6px;">GOLD LAKE GARDA</div>
<div style="font-size:13px;letter-spacing:3px;color:#f1d27a;margin-top:6px;">BULLDOG FRANCESE</div>
</td></tr>
<tr><td style="padding:20px 24px 4px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #c9e3f5;border-bottom:1px solid #c9e3f5;">
${riga("Iscrizioni confermate", String(s.iscrizioni))}
${riga("Persone", String(s.persone))}
${riga("Bulldog Francesi", `${s.bulldog} / ${OBIETTIVO} (${String(perc).replace(".", ",")}%)`)}
${riga("Nuove nelle ultime 24 ore", `${s.nuove.length} iscrizioni · ${s.nuoveBulldog} bulldog`)}
${riga("Vogliono entrare nel gruppo WhatsApp", String(s.whatsapp.length))}
</table>
<div style="margin-top:18px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:bold;">Da controllare</div>
${htmlSegnalazioni}
<div style="margin-top:22px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:bold;">Tutti gli iscritti</div>
${tabella}
</td></tr>
<tr><td style="padding:16px 24px 22px;text-align:center;border-top:1px solid #c9e3f5;">
<div style="font-size:12px;color:#66739a;">Messaggio automatico, una volta al giorno · L'elenco completo con tutti i dati è nel CSV allegato (si apre con Excel).</div>
</td></tr>
</table></td></tr></table></body></html>`;

  const testoSegnalazioni = segnalazioni.filter(([, v]) => v.length)
    .map(([t, v]) => `- ${t} — ${v.length}: n. ${elencoNumeri(v)}`).join("\n") || "- Niente da controllare.";
  const text = [
    `REPORT ISCRIZIONI DEL ${oggi} — 3° Raduno Nazionale Gold Lake Garda Bulldog Francese`,
    "",
    `Iscrizioni confermate: ${s.iscrizioni}`,
    `Persone: ${s.persone}`,
    `Bulldog Francesi: ${s.bulldog} / ${OBIETTIVO}`,
    `Nuove nelle ultime 24 ore: ${s.nuove.length} iscrizioni, ${s.nuoveBulldog} bulldog`,
    `Vogliono entrare nel gruppo WhatsApp: ${s.whatsapp.length}`,
    "",
    "DA CONTROLLARE",
    testoSegnalazioni,
    "",
    righe.length
      ? "L'elenco completo di tutti gli iscritti, con i flag, è nel file CSV allegato."
      : "Nessuna iscrizione ricevuta finora.",
  ].join("\n");

  return { oggetto, html, text, s };
}

function destinatari(extra: unknown): string[] | null {
  const raw = typeof extra === "string" && extra.trim()
    ? extra
    : (Deno.env.get("BULLDOG_REPORT_TO") || DESTINATARI_DI_DEFAULT);
  const lista = raw.split(",").map((a) => a.trim()).filter(Boolean);
  if (!lista.length || lista.length > 5 || !lista.every((a) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a))) return null;
  return lista;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(401, { error: "unauthorized" });

  const supabase = admin();
  const { data: autorizzato, error: errAuth } = await supabase.rpc("bf_report_autorizzato", { p_token: token });
  if (errAuth) {
    console.error("auth:", errAuth.code, errAuth.message);
    return json(500, { error: "server" });
  }
  if (autorizzato !== true) return json(401, { error: "unauthorized" });

  let opzioni: Record<string, unknown> = {};
  try {
    opzioni = await req.json();
  } catch { /* corpo vuoto: va bene */ }
  const dryRun = opzioni.dry_run === true;
  const a = destinatari(opzioni.to);
  if (!a) return json(400, { error: "destinatari" });

  const { data, error } = await supabase.rpc("bf_report");
  if (error) {
    console.error("report:", error.code, error.message);
    return json(500, { error: "server" });
  }
  const righe = ((data as { righe: Riga[] })?.righe ?? []) as Riga[];

  const oggi = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date());
  const oggiIso = oggi.split("/").reverse().join("-");
  const { oggetto, html, text, s } = costruisciEmail(righe, oggi);
  const csv = costruisciCsv(righe);

  const sintesi = {
    iscrizioni: s.iscrizioni, persone: s.persone, bulldog: s.bulldog, totaleRighe: righe.length,
    nuove: s.nuove.length, doppioni: s.doppioni.length, mailDaControllare: s.mailKo.length,
    annullate: s.annullate.length, whatsapp: s.whatsapp.length, daControllare: s.daControllare,
  };
  if (dryRun) return json(200, { ok: true, dry_run: true, destinatari: a, oggetto, sintesi, righeCsv: righe.length });

  const chiave = (Deno.env.get("BULLDOG_RESEND_API_KEY") || Deno.env.get("RESEND_API_KEY") || "").trim();
  const mittente = (Deno.env.get("BULLDOG_RESEND_FROM") || "").trim();
  if (!chiave || !mittente) return json(500, { error: "resend_non_configurato" });
  const rispondiA = (Deno.env.get("BULLDOG_RESEND_REPLY_TO") || "").trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chiave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: mittente,
        to: a,
        subject: oggetto,
        html,
        text,
        attachments: [{ filename: `iscrizioni-${oggiIso}.csv`, content: encodeBase64(new TextEncoder().encode(csv)) }],
        ...(rispondiA ? { reply_to: rispondiA } : {}),
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      let nome = "";
      let messaggio = "";
      try {
        const corpo = await res.json();
        nome = String(corpo?.name ?? "");
        messaggio = String(corpo?.message ?? "").slice(0, 300);
      } catch { /* risposta non JSON */ }
      console.error("resend:", res.status, nome, messaggio);
      return json(502, { error: `resend_${res.status}${nome ? ":" + nome : ""}` });
    }
  } catch (e) {
    console.error("resend:", (e as Error).name);
    return json(502, { error: `resend_${(e as Error).name}` });
  }

  return json(200, { ok: true, inviato: true, destinatari: a, sintesi });
});
