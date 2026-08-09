import { supabase } from './supabase';
import { logMail } from './maillog';
import { inr, deg, CLOUDINARY_CLOUD } from './format';
import { SITE_URL } from '@/lib/site';

// Email clients (Outlook, older Yahoo) cannot render WebP/AVIF, so never use
// f_auto here — always deliver a plain JPEG at a fixed size.
function mailImg(p, w = 800, h) {
  const id = p.image_public_id || `nomad/${p.photo_id}`;
  const crop = h ? `w_${w},h_${h},c_fill` : `w_${w},c_fill`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${crop},q_auto:good,f_jpg/${id}`;
}

const MANDRILL_KEY = process.env.MANDRILL_API_KEY || '';
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'postcards@foxnetglobal.com';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'The Nomad';
const REPLY_TO = process.env.MAIL_REPLY_TO || FROM_EMAIL;
const SITE = SITE_URL;
const MAIL_RPC_SECRET = process.env.MAIL_RPC_SECRET || '';

/* ─────────────────────────  CONSENT  ───────────────────────── */

// Every marketing email must carry a working unsubscribe link, which means we
// need the recipient's token. Subscribers are not readable with the anon key,
// so this goes through a secret-gated security-definer RPC. Returns null for
// people who have no subscriber row (order-only customers) — in that case the
// email simply carries no unsubscribe link, which is correct: there is nothing
// to unsubscribe from.
export async function subscriberToken(email) {
  if (!email || !MAIL_RPC_SECRET) return null;
  try {
    const { data } = await supabase().rpc('mail_subscriber_token', {
      p_secret: MAIL_RPC_SECRET,
      p_email: email,
    });
    return data || null;
  } catch (e) {
    console.error('[mail] token lookup failed:', e.message);
    return null;
  }
}

export function unsubUrl(token) {
  return token ? `${SITE}/unsubscribe?t=${encodeURIComponent(token)}` : null;
}

async function isSuppressed(email) {
  const { data, error } = await supabase().rpc('is_unsubscribed', { p_email: email });
  if (error) throw new Error(error.message);
  return !!data;
}

/* ─────────────────────────  MANDRILL TRANSPORT  ───────────────────────── */

/**
 * Sends one message and records it in mail_log.
 *
 * `marketing` messages (newsletter, drop list) carry List-Unsubscribe headers
 * and are hard-blocked for anyone on the suppression list.
 *
 * `transactional` messages (order confirmation, shipping) are exempt from the
 * suppression list on purpose: unsubscribing from the postcards must not stop
 * the receipt for something you have already paid for. The exemption is opt-in
 * per call and is recorded in mail_log so it is auditable.
 *
 * Returns { suppressed: true } instead of throwing when a send is skipped, so
 * callers know not to log it as sent.
 */
export async function sendMail({
  to,
  toName,
  subject,
  html,
  text,
  tags = [],
  metadata = {},
  kind = 'mail',
  unsubToken = null,
  marketing = false,
  transactional = false,
  // Open/click tracking. On by default because it is what the newsletter and
  // the drop mail want. Auth mail turns BOTH off — see the note at the send
  // call below for why click tracking on a one-time link is dangerous.
  track = true,
}) {
  let suppressed = false;
  try {
    suppressed = await isSuppressed(to);
  } catch (e) {
    // Fail closed for marketing, open for transactional: never risk emailing
    // someone who opted out, never risk losing a receipt.
    console.error('[mail] suppression check failed:', e.message);
    suppressed = !transactional;
  }
  if (suppressed && !transactional) {
    await logMail(to, kind, subject, 'suppressed', 'on the unsubscribe list');
    return { skipped: true, suppressed: true, email: to };
  }

  if (!MANDRILL_KEY) {
    console.warn('[mail] MANDRILL_API_KEY not set — skipping send to', to);
    return { skipped: true };
  }

  const headers = { 'Reply-To': REPLY_TO };
  if (marketing && unsubToken) {
    // RFC 8058 one-click, plus the mailto fallback older clients expect.
    headers['List-Unsubscribe'] =
      `<${SITE}/api/unsubscribe/one-click?t=${encodeURIComponent(unsubToken)}>, <mailto:${FROM_EMAIL}?subject=unsubscribe>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: MANDRILL_KEY,
      message: {
        html,
        text,
        subject,
        from_email: FROM_EMAIL,
        from_name: FROM_NAME,
        headers,
        to: [{ email: to, name: toName || undefined, type: 'to' }],
        // Mandrill rewrites every href through mandrillapp.com/track/click when
        // this is on. For marketing that is the point. For a single-use sign-in
        // link it is a live hazard: corporate link scanners (Outlook Safe Links
        // and friends) pre-fetch URLs in email, a pre-fetch spends the token,
        // and the customer then clicks a dead link and cannot get in. It also
        // makes an auth email look structurally like phishing, since the
        // visible host is not ours.
        //
        // Setting these per message is the only reliable control. Mandrill's
        // account-level "Sending Defaults" do NOT govern its SMTP relay — that
        // was tested four times over 77 minutes on 8 Aug 2026 and never took
        // effect, which is the whole reason auth mail comes through here now
        // rather than through Supabase's SMTP.
        track_opens: track,
        track_clicks: track,
        auto_text: false,
        inline_css: true,
        tags,
        metadata,
      },
    }),
  });
  const data = await res.json();
  const fail = async (msg) => {
    await logMail(to, kind, subject, 'failed', msg);
    const err = new Error(msg);
    err.logged = true; // so callers do not log the same failure twice
    throw err;
  };
  if (!res.ok || data?.status === 'error') {
    return fail(`Mandrill: ${data?.message || res.status}`);
  }
  const first = Array.isArray(data) ? data[0] : data;
  if (first?.status === 'rejected' || first?.status === 'invalid') {
    return fail(`Mandrill rejected (${first.reject_reason || first.status})`);
  }
  await logMail(
    to,
    kind,
    subject,
    'sent',
    suppressed ? 'unsubscribed recipient — transactional exemption' : null
  );
  return first;
}

/* ─────────────────────────  SHARED CHROME  ───────────────────────── */

const INK = '#111111';
const CREAM = '#FCF7E8';
const SAND = '#F2E38F';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Instrument Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

const kicker = (t, color = MUTED) =>
  `<div style="font-family:${SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${color}">${t}</div>`;

// Marketing mail must offer a one-click way out; transactional mail must not
// pretend to be a list you can leave — it explains itself instead.
function consentBlock({ unsub, why }) {
  const line = why || 'You are receiving this because you asked us to write.';
  return unsub
    ? `${line} <a href="${unsub}" style="color:${FAINT};text-decoration:underline">Unsubscribe</a>`
    : line;
}

function shell({ preheader, accent = CREAM, body, footerNote, unsub, why }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<title>The Nomad</title></head>
<body style="margin:0;padding:0;background:${accent};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${accent}">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%">

    <tr><td style="padding:0 0 26px">
      <table role="presentation" width="100%"><tr>
        <td style="font-family:${SANS};font-size:13px;letter-spacing:0.42em;text-transform:uppercase;font-weight:600;color:${INK}">The Nomad</td>
        <td align="right" style="font-family:${SERIF};font-style:italic;font-size:16px;color:${MUTED}">Collectibles worth bringing home</td>
      </tr></table>
    </td></tr>

    ${body}

    <tr><td style="padding:34px 0 0">
      <table role="presentation" width="100%" style="border-top:1px solid ${LINE}">
        <tr><td style="padding:22px 0 0">
          ${footerNote ? `<div style="font-family:${SERIF};font-style:italic;font-size:16px;color:${MUTED};margin-bottom:18px">${footerNote}</div>` : ''}
          <div style="font-family:${SANS};font-size:11px;line-height:1.9;color:${FAINT}">
            <a href="${SITE}/shop" style="color:${MUTED};text-decoration:none">Objects</a> &nbsp;·&nbsp;
            <a href="${SITE}/world" style="color:${MUTED};text-decoration:none">World map</a> &nbsp;·&nbsp;
            <a href="${SITE}/journal" style="color:${MUTED};text-decoration:none">Journal</a> &nbsp;·&nbsp;
            <a href="${SITE}/drops" style="color:${MUTED};text-decoration:none">Drops</a>
          </div>
          <div style="font-family:${SANS};font-size:11px;line-height:1.8;color:${FAINT};margin-top:14px">
            © 2026 The Nomad · New Delhi<br>
            ${consentBlock({ unsub, why })}
          </div>
        </td></tr>
      </table>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

function card(inner, bg = '#FFFFFF', pad = '34px 32px') {
  return `<tr><td style="padding:0 0 18px"><table role="presentation" width="100%" style="background:${bg};border-radius:4px"><tr><td style="padding:${pad}">${inner}</td></tr></table></td></tr>`;
}

function button(label, href, bg = INK, color = '#FFFDF4') {
  return `<a href="${href}" style="display:inline-block;background:${bg};color:${color};font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;padding:15px 30px;border-radius:999px;text-decoration:none">${label}</a>`;
}

function productRow(p, note) {
  return `<table role="presentation" width="100%" style="border-bottom:1px solid ${LINE}"><tr>
    <td width="72" style="padding:14px 0"><img src="${mailImg(p, 120, 150)}" width="60" height="75" alt="${p.name}" style="display:block;width:60px;height:75px;object-fit:cover;border-radius:2px"></td>
    <td style="padding:14px 0;font-family:${SANS};font-size:14px;color:${INK}">
      ${p.name}
      <div style="font-size:11px;color:${MUTED};margin-top:5px">${p.city}, ${p.country}</div>
      ${note ? `<div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${FAINT};margin-top:6px">${note}</div>` : ''}
    </td>
    <td align="right" style="padding:14px 0;font-family:${SANS};font-size:14px;color:${INK};white-space:nowrap">${inr(p.price)}</td>
  </tr></table>`;
}

function passportCard(i) {
  return `
    <table role="presentation" width="100%" style="background:#FFFFFF;border:1px solid ${LINE};border-radius:4px;margin-bottom:14px"><tr><td style="padding:26px 26px">
      <table role="presentation" width="100%" style="border-bottom:1px solid ${INK};padding-bottom:12px"><tr>
        <td style="font-family:${SANS};font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:${INK};padding-bottom:12px">The Nomad Object Passport</td>
        <td align="right" style="font-family:${SERIF};font-style:italic;font-size:15px;color:${MUTED};padding-bottom:12px">TN</td>
      </tr></table>
      <table role="presentation" width="100%"><tr>
        <td width="100" style="padding:20px 18px 0 0" valign="top">
          <img src="${mailImg(i.product, 172, 214)}" width="86" alt="${i.product.name}" style="display:block;width:86px;height:107px;object-fit:cover;border-radius:2px">
        </td>
        <td valign="top" style="padding:20px 0 0">
          <div style="font-family:${SERIF};font-size:24px;line-height:1.2;color:${INK}">${i.product.name}</div>
          <div style="font-family:${SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${FAINT};margin-top:8px">${i.product.object_no}</div>
          <table role="presentation" width="100%" style="margin-top:16px">
            <tr>
              <td style="padding:5px 0;font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${FAINT}" width="96">Origin</td>
              <td style="padding:5px 0;font-family:${SANS};font-size:12px;color:#4A4A47">${i.product.city}, ${i.product.country}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${FAINT}">Coordinates</td>
              <td style="padding:5px 0;font-family:${SANS};font-size:12px;color:#4A4A47">${deg(i.product.lat, 'N', 'S')} / ${deg(i.product.lon, 'E', 'W')}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${FAINT}">Material</td>
              <td style="padding:5px 0;font-family:${SANS};font-size:12px;color:#4A4A47">${i.product.material}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${FAINT}">Quantity</td>
              <td style="padding:5px 0;font-family:${SANS};font-size:12px;color:#4A4A47">${i.qty} × ${inr(i.price)}</td>
            </tr>
          </table>
        </td>
      </tr></table>
    </td></tr></table>`;
}

/* ─────────────────────────  LIVE DATA HELPERS  ───────────────────────── */

// Deterministic-but-rotating pick so consecutive signups don't all get the same object
function pick(arr, seed) {
  if (!arr || arr.length === 0) return null;
  const i = Math.abs(hash(String(seed))) % arr.length;
  return arr[i];
}
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i), (h |= 0);
  return h;
}

export function nextDrop() {
  // Next Sunday 11:00 IST
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 5, 30, 0));
  let add = (7 - t.getUTCDay()) % 7;
  if (add === 0 && t.getTime() <= now.getTime()) add = 7;
  t.setUTCDate(t.getUTCDate() + add);
  const days = Math.max(0, Math.ceil((t.getTime() - now.getTime()) / 864e5));
  return {
    date: t,
    days,
    label: t.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Kolkata',
    }),
  };
}

async function collectionStats() {
  const { data } = await supabase().from('products').select('*').order('id');
  const products = data || [];
  const countries = new Set(products.map((p) => p.country));
  const cities = new Set(products.map((p) => p.city));
  return { products, countries: countries.size, cities: cities.size, total: products.length };
}

/* ─────────────────────────  1 · NEWSLETTER WELCOME  ───────────────────────── */

const OPENERS = [
  {
    line: 'We are writing from a room above a workshop, with the window open.',
    place: 'Somewhere between a market and a suitcase',
  },
  {
    line: 'This week we walked eleven kilometres and bought three things.',
    place: 'Field notes, written on a train',
  },
  {
    line: 'Everything here was carried home by hand, in hold luggage, wrapped in a jumper.',
    place: 'Written the morning after landing',
  },
  {
    line: 'We do not buy on the first visit. If it is still on our minds the next morning, we go back.',
    place: 'A rule we have never broken',
  },
];

export async function welcomeEmail(email, token) {
  const unsub = unsubUrl(token);
  const { products, countries, cities, total } = await collectionStats();
  const inStock = products.filter((p) => p.stock > 0);
  const featured = pick(inStock, email) || products[0];
  const opener = pick(OPENERS, email + 'o') || OPENERS[0];
  const drop = nextDrop();

  const subject = `Postcard № 001 — ${total} objects, ${countries} countries, one suitcase`;
  const preheader = `${opener.line} Inside: ${featured ? featured.name : 'the collection'} and where it came from.`;

  const body = `
    ${card(
      `${kicker('Postcard № 001 · ' + opener.place, FAINT)}
       <div style="font-family:${SERIF};font-weight:300;font-size:40px;line-height:1.1;color:${INK};margin:18px 0 20px">You&rsquo;re on the list.</div>
       <div style="font-family:${SERIF};font-style:italic;font-size:21px;line-height:1.55;color:#4A4A47;margin-bottom:22px">&ldquo;${opener.line}&rdquo;</div>
       <div style="font-family:${SANS};font-size:14px;line-height:1.85;color:${MUTED}">
         Twice a month, no more, we write about what we found and where — a workshop off a market street,
         a stationer who has sold the same notebook since 1972, the occasional thing we should not have bought.
         Every object arrives with a passport card recording its coordinates and its maker.
       </div>`,
      '#FFFFFF',
      '38px 34px'
    )}

    ${card(
      `<table role="presentation" width="100%"><tr>
        <td width="33%" align="center" style="font-family:${SERIF};font-size:34px;color:${INK}">${total}<div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:${MUTED};margin-top:7px">Objects</div></td>
        <td width="33%" align="center" style="font-family:${SERIF};font-size:34px;color:${INK}">${countries}<div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:${MUTED};margin-top:7px">Countries</div></td>
        <td width="33%" align="center" style="font-family:${SERIF};font-size:34px;color:${INK}">${cities}<div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:${MUTED};margin-top:7px">Cities</div></td>
      </tr></table>`,
      SAND,
      '26px 24px'
    )}

    ${
      featured
        ? card(
            `${kicker('To start you off')}
             <div style="font-family:${SERIF};font-weight:300;font-size:28px;line-height:1.15;color:${INK};margin:14px 0 18px">${featured.name}</div>
             <img src="${mailImg(featured, 1072, 670)}" width="536" alt="${featured.name}" style="display:block;width:100%;max-width:536px;height:auto;border-radius:3px;margin-bottom:20px">
             <div style="font-family:${SANS};font-size:14px;line-height:1.8;color:#4A4A47">${featured.description}</div>
             <table role="presentation" width="100%" style="margin-top:20px;border-top:1px solid ${LINE}"><tr>
               <td style="padding-top:16px;font-family:${SANS};font-size:12px;color:${MUTED}">
                 ${featured.city}, ${featured.country} · ${featured.material}<br>
                 <span style="color:${FAINT}">${deg(featured.lat, 'N', 'S')} / ${deg(featured.lon, 'E', 'W')}</span>
               </td>
               <td align="right" style="padding-top:16px;font-family:${SANS};font-size:16px;color:${INK}">${inr(featured.price)}</td>
             </tr></table>
             <div style="margin-top:26px">${button('See this object →', `${SITE}/product/${featured.slug}`)}</div>`
          )
        : ''
    }

    <tr><td style="padding:0 0 18px">
      <table role="presentation" width="100%" style="background:${INK};border-radius:4px"><tr><td style="padding:30px 32px">
        ${kicker('Coming up', '#8A8A85')}
        <div style="font-family:${SERIF};font-weight:300;font-size:24px;line-height:1.25;color:#FFFFFF;margin:14px 0 12px">Drop 006 — Tokyo, in ${drop.days} ${drop.days === 1 ? 'day' : 'days'}</div>
        <div style="font-family:${SANS};font-size:13px;line-height:1.8;color:#B4B0A6;margin-bottom:20px">
          Twenty-eight objects from six days in Nakameguro, Kuramae and Yanaka — released all at once on ${drop.label}, 11:00 IST.
          Nothing restocked, nothing discounted.
        </div>
        ${button('Join the drop list →', `${SITE}/drops`, '#FFFFFF', INK)}
      </td></tr></table>
    </td></tr>
  `;

  const text = `POSTCARD № 001 — The Nomad

You're on the list.

"${opener.line}"

Twice a month, no more, we write about what we found and where. Every object arrives with a passport card recording its coordinates and its maker.

${total} objects · ${countries} countries · ${cities} cities

${featured ? `TO START YOU OFF\n${featured.name} — ${inr(featured.price)}\n${featured.description}\n${featured.city}, ${featured.country} · ${featured.material}\n${SITE}/product/${featured.slug}\n` : ''}
COMING UP
Drop 006 — Tokyo, in ${drop.days} days. Twenty-eight objects, released ${drop.label} at 11:00 IST.
${SITE}/drops

© 2026 The Nomad · New Delhi
${unsub ? `Unsubscribe: ${unsub}` : ''}`;

  return {
    subject,
    html: shell({
      preheader,
      body,
      footerNote: 'Thank you for letting us write to you.',
      unsub,
    }),
    text,
  };
}

/* ─────────────────────────  2 · DROP LIST  ───────────────────────── */

export async function dropEmail(email, token) {
  const unsub = unsubUrl(token);
  const drop = nextDrop();
  const { data: drops } = await supabase().from('drops').select('*').order('id');
  const past = drops || [];
  const { products } = await collectionStats();
  const teaser = products.filter((p) => p.country === 'Japan').slice(0, 3);

  const subject = `You're on the list — Drop 006 lands ${drop.label}, 11:00 IST`;
  const preheader = `Twenty-eight objects from Tokyo, released all at once in ${drop.days} ${drop.days === 1 ? 'day' : 'days'}. When they are gone, they are gone.`;

  const body = `
    <tr><td style="padding:0 0 18px">
      <table role="presentation" width="100%" style="background:${INK};border-radius:4px"><tr><td style="padding:40px 34px">
        ${kicker('Nomad Drops', '#8A8A85')}
        <div style="font-family:${SERIF};font-weight:300;font-size:42px;line-height:1.05;color:#FFFFFF;margin:18px 0 18px">We release what we find, all at once.</div>
        <div style="font-family:${SANS};font-size:14px;line-height:1.85;color:#B4B0A6;margin-bottom:30px">
          You are on the list for <strong style="color:#FFFFFF">Drop 006 — Tokyo</strong>. Twenty-eight objects,
          collected over six days and released in one moment. Nothing is restocked, nothing is discounted.
          We will write to you the morning it opens.
        </div>
        <table role="presentation" style="margin-bottom:30px"><tr>
          <td style="padding-right:38px">
            <div style="font-family:${SERIF};font-size:52px;line-height:1;color:#FFFFFF">${String(drop.days).padStart(2, '0')}</div>
            <div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#8A8A85;margin-top:8px">Days to go</div>
          </td>
          <td style="padding-right:38px">
            <div style="font-family:${SERIF};font-size:52px;line-height:1;color:#FFFFFF">28</div>
            <div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#8A8A85;margin-top:8px">Objects</div>
          </td>
          <td>
            <div style="font-family:${SERIF};font-size:52px;line-height:1;color:#FFFFFF">06</div>
            <div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#8A8A85;margin-top:8px">Drop no.</div>
          </td>
        </tr></table>
        <div style="font-family:${SANS};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8A8A85">${drop.label} · 11:00 IST</div>
      </td></tr></table>
    </td></tr>

    ${
      teaser.length
        ? card(
            `${kicker('A taste of what Tokyo looked like last time')}
             <div style="margin-top:16px">${teaser.map((p) => productRow(p)).join('')}</div>
             <div style="margin-top:26px">${button('Browse the archive →', `${SITE}/country/japan`)}</div>`
          )
        : ''
    }

    ${card(
      `${kicker('Previously released', FAINT)}
       <table role="presentation" width="100%" style="margin-top:14px">
         ${past
           .map(
             (d) => `<tr>
              <td style="padding:11px 0;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${FAINT}">${d.drop_no}</td>
              <td style="padding:11px 0;border-bottom:1px solid ${LINE};font-family:${SERIF};font-size:19px;color:${INK}">${d.city}</td>
              <td align="right" style="padding:11px 0;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${FAINT}">${d.status}</td>
            </tr>`
           )
           .join('')}
       </table>`
    )}
  `;

  const text = `NOMAD DROPS — You're on the list

Drop 006 — Tokyo lands ${drop.label} at 11:00 IST — ${drop.days} days to go.

Twenty-eight objects, collected over six days and released in one moment. Nothing restocked, nothing discounted. We'll write the morning it opens.

PREVIOUSLY RELEASED
${past.map((d) => `${d.drop_no} · ${d.city} — ${d.status}`).join('\n')}

${SITE}/drops
© 2026 The Nomad · New Delhi
${unsub ? `Unsubscribe: ${unsub}` : ''}`;

  return {
    subject,
    html: shell({ preheader, body, footerNote: 'When they are gone, they are gone.', unsub }),
    text,
  };
}

/* ─────────────────────────  3 · NOTIFY ME  ───────────────────────── */

export async function notifyEmail(email, itemName, token) {
  const unsub = unsubUrl(token);
  const { data } = await supabase().from('coming_soon').select('*').eq('name', itemName).maybeSingle();
  const item = data || { name: itemName, origin: 'in transit', eta: 'soon', obj_no: '—' };
  const { data: all } = await supabase().from('coming_soon').select('*').order('id');
  const others = (all || []).filter((s) => s.name !== itemName).slice(0, 3);

  const subject = `We'll write the morning the ${item.name} lands`;
  const preheader = `${item.obj_no} — currently somewhere between ${item.origin} and a Mumbai customs shed. Arriving ${item.eta}.`;

  const body = `
    ${card(
      `${kicker('In transit · watch list confirmed', FAINT)}
       <div style="font-family:${SERIF};font-weight:300;font-size:38px;line-height:1.12;color:${INK};margin:18px 0 18px">${item.name}</div>
       <div style="font-family:${SANS};font-size:14px;line-height:1.85;color:${MUTED};margin-bottom:28px">
         Consider it watched. This object has already been bought, packed and shipped — it is somewhere
         between a workshop in ${item.origin} and a customs shed in Mumbai. The moment it clears and lands
         on the shelf, you will be the first to know.
       </div>
       <table role="presentation" width="100%" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE}">
         <tr>
           <td style="padding:18px 0">
             ${kicker('Object no.', FAINT)}
             <div style="font-family:${SANS};font-size:14px;color:${INK};margin-top:8px">${item.obj_no}</div>
           </td>
           <td style="padding:18px 0">
             ${kicker('Origin', FAINT)}
             <div style="font-family:${SANS};font-size:14px;color:${INK};margin-top:8px">${item.origin}</div>
           </td>
           <td style="padding:18px 0">
             ${kicker('Arriving', FAINT)}
             <div style="font-family:${SANS};font-size:14px;color:${INK};margin-top:8px">${item.eta}</div>
           </td>
         </tr>
       </table>
       <div style="margin-top:28px">${button('See everything in transit →', `${SITE}/soon`)}</div>`,
      '#FFFFFF',
      '38px 34px'
    )}

    ${
      others.length
        ? card(
            `${kicker('Also on its way home')}
             <table role="presentation" width="100%" style="margin-top:14px">
               ${others
                 .map(
                   (s) => `<tr>
                    <td style="padding:13px 0;border-bottom:1px solid ${LINE}">
                      <div style="font-family:${SERIF};font-size:20px;color:${INK}">${s.name}</div>
                      <div style="font-family:${SANS};font-size:11px;color:${MUTED};margin-top:5px">${s.origin}</div>
                    </td>
                    <td align="right" style="padding:13px 0;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${FAINT}">${s.eta}</td>
                  </tr>`
                 )
                 .join('')}
             </table>`,
            CREAM
          )
        : ''
    }
  `;

  const text = `IN TRANSIT — watch list confirmed

${item.name}
${item.obj_no} · ${item.origin} · arriving ${item.eta}

This object has already been bought, packed and shipped. The moment it lands, you'll be the first to know.

${others.length ? `ALSO ON ITS WAY HOME\n${others.map((s) => `${s.name} — ${s.origin}, ${s.eta}`).join('\n')}\n` : ''}
${SITE}/soon
© 2026 The Nomad · New Delhi`;

  return {
    subject,
    html: shell({
      preheader,
      body,
      footerNote: 'Some things are worth the wait, and the paperwork.',
      why: `You are receiving this because you asked to be told when the ${item.name} lands.`,
      unsub,
    }),
    text,
  };
}

/* ─────────────────────────  4 · ORDER CONFIRMATION  ───────────────────────── */

export async function orderEmail(order, items) {
  const first = (order.full_name || '').trim().split(' ')[0] || 'there';
  const count = items.reduce((t, i) => t + i.qty, 0);
  const countries = [...new Set(items.map((i) => i.product.country))];

  const subject = `Order confirmed — ${count} ${count === 1 ? 'object' : 'objects'} from ${
    countries.length === 1 ? countries[0] : `${countries.length} countries`
  }`;
  const preheader = `Wrapped in unbleached paper, each with its passport card. Order ${String(order.id).slice(0, 8)}.`;

  const passports = items.map(passportCard).join('');

  const track = order.lookup_token
    ? `${SITE}/order/${order.id}?t=${order.lookup_token}`
    : `${SITE}/order-lookup`;


  const body = `
    ${card(
      `${kicker('Order confirmed', FAINT)}
       <div style="font-family:${SERIF};font-weight:300;font-size:40px;line-height:1.1;color:${INK};margin:18px 0 18px">Thank you, ${first}.</div>
       <div style="font-family:${SANS};font-size:14px;line-height:1.85;color:${MUTED}">
         Your ${count === 1 ? 'object is' : `${count} objects are`} being wrapped in unbleached paper${
        order.gift ? ', sealed by hand with a wax seal' : ''
      }, each with its passport card.
         ${
           countries.length > 1
             ? `They come from ${countries.slice(0, -1).join(', ')} and ${countries.slice(-1)}.`
             : `They come from ${countries[0]}.`
         }
         We will write again the day ${count === 1 ? 'it ships' : 'they ship'}.
       </div>
       <table role="presentation" width="100%" style="margin-top:26px;border-top:1px solid ${LINE}"><tr>
         <td style="padding-top:18px">${kicker('Order no.', FAINT)}<div style="font-family:${SANS};font-size:13px;color:${INK};margin-top:8px">${String(order.id).slice(0, 8).toUpperCase()}</div></td>
         <td style="padding-top:18px">${kicker('Payment', FAINT)}<div style="font-family:${SANS};font-size:13px;color:${INK};margin-top:8px">${order.payment_method}</div></td>
         <td style="padding-top:18px">${kicker('Ships in', FAINT)}<div style="font-family:${SANS};font-size:13px;color:${INK};margin-top:8px">2–3 days</div></td>
       </tr></table>`,
      '#FFFFFF',
      '38px 34px'
    )}

    <tr><td style="padding:0 0 4px">${kicker('The passports')}</td></tr>
    <tr><td style="padding:14px 0 4px">${passports}</td></tr>

    ${card(
      `<table role="presentation" width="100%">
        <tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">Subtotal</td>
            <td align="right" style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">${inr(order.subtotal)}</td></tr>
        ${order.gift_fee ? `<tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">Gift packaging</td><td align="right" style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">${inr(order.gift_fee)}</td></tr>` : ''}
        ${order.cod_fee ? `<tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">COD handling</td><td align="right" style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">${inr(order.cod_fee)}</td></tr>` : ''}
        <tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">Shipping</td>
            <td align="right" style="padding:5px 0;font-family:${SANS};font-size:13px;color:${MUTED}">${order.ship_fee ? inr(order.ship_fee) : 'Free'}</td></tr>
        <tr><td style="padding:16px 0 0;border-top:1px solid ${LINE};font-family:${SANS};font-size:17px;color:${INK}">Total</td>
            <td align="right" style="padding:16px 0 0;border-top:1px solid ${LINE};font-family:${SANS};font-size:17px;color:${INK}">${inr(order.total)}</td></tr>
      </table>
      ${
        order.address
          ? `<div style="margin-top:26px;padding-top:20px;border-top:1px solid ${LINE}">
              ${kicker('Deliver to', FAINT)}
              <div style="font-family:${SANS};font-size:13px;line-height:1.8;color:#4A4A47;margin-top:10px">
                ${order.full_name}<br>${[order.address, order.city, order.state, order.pin].filter(Boolean).join(', ')}
                ${order.mobile ? `<br>${order.mobile}` : ''}
              </div>
            </div>`
          : ''
      }
      <div style="margin-top:28px;padding-top:24px;border-top:1px solid ${LINE}">
        ${kicker('Keep this', FAINT)}
        <div style="font-family:${SANS};font-size:13px;line-height:1.8;color:${MUTED};margin:12px 0 20px">
          This link stays live for the life of the order — the passports, the status, and the
          tracking number once it exists. Lost it? Look the order up with your order number and email.
        </div>
        ${button('Track this order →', track)}
        <div style="margin-top:16px;font-family:${SANS};font-size:12px">
          <a href="${SITE}/shop" style="color:${MUTED};text-decoration:none;border-bottom:1px solid ${LINE}">Continue exploring</a>
          &nbsp;·&nbsp;
          <a href="${SITE}/order-lookup" style="color:${MUTED};text-decoration:none;border-bottom:1px solid ${LINE}">Find an order</a>
        </div>
      </div>`,
      CREAM
    )}
  `;

  const text = `ORDER CONFIRMED — The Nomad

Thank you, ${first}.

Your ${count === 1 ? 'object is' : `${count} objects are`} being wrapped in unbleached paper, each with its passport card.

Order no. ${String(order.id).slice(0, 8).toUpperCase()} · ${order.payment_method} · ships in 2–3 days

${items
  .map(
    (i) =>
      `${i.product.name} × ${i.qty} — ${inr(i.price * i.qty)}\n  ${i.product.object_no}\n  ${i.product.city}, ${i.product.country} · ${i.product.material}\n  ${deg(i.product.lat, 'N', 'S')} / ${deg(i.product.lon, 'E', 'W')}`
  )
  .join('\n\n')}

Subtotal ${inr(order.subtotal)}${order.gift_fee ? `\nGift packaging ${inr(order.gift_fee)}` : ''}${order.cod_fee ? `\nCOD handling ${inr(order.cod_fee)}` : ''}
TOTAL ${inr(order.total)}

TRACK THIS ORDER
${track}
Lost the link? ${SITE}/order-lookup — order number and email.

© 2026 The Nomad · New Delhi`;

  return {
    subject,
    html: shell({
      preheader,
      body,
      footerNote: 'Thank you for giving these objects a new home.',
      why: `You are receiving this because you placed order ${String(order.id)
        .slice(0, 8)
        .toUpperCase()} with us. It is a record of that order, not a mailing list.`,
    }),
    text,
  };
}

/* ─────────────────────────  5 · ORDER ON ITS WAY  ───────────────────────── */

export const ORDER_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered'];

const STATUS_COPY = {
  packed: {
    kicker: 'Packed',
    head: 'Wrapped, sealed, waiting for the van.',
    line: (n) =>
      `Your ${n === 1 ? 'object has' : 'objects have'} been wrapped in unbleached paper, each with its
       passport card, and boxed this morning. The courier collects at five.`,
    note: 'Nothing is machine-packed. If the tape looks hand-cut, it is.',
    subject: (n) => `Packed — ${n === 1 ? 'your object is' : `your ${n} objects are`} boxed and waiting for the courier`,
  },
  shipped: {
    kicker: 'On its way',
    head: 'It has left the building.',
    line: (n) =>
      `Handed to the courier this afternoon. ${n === 1 ? 'It' : 'They'} will travel a great deal less
       far than ${n === 1 ? 'it' : 'they'} did to reach us.`,
    note: 'Somebody will need to be in. We are told the drivers do not wait long.',
    subject: () => 'On its way — your objects have left New Delhi',
  },
  delivered: {
    kicker: 'Delivered',
    head: 'Home.',
    line: (n) =>
      `Marked delivered. Unwrap ${n === 1 ? 'it' : 'them'} slowly — the passport card is in the paper,
       not the box, and people throw the paper away.`,
    note: 'If anything arrived less than perfect, reply to this email and we will put it right.',
    subject: () => 'Delivered — the passports are in the paper',
  },
};

function timeline(current) {
  const steps = [
    ['Confirmed', 'Order taken'],
    ['Packed', 'Wrapped by hand'],
    ['Shipped', 'With the courier'],
    ['Delivered', 'Home'],
  ];
  const at = Math.max(0, ORDER_STATUSES.indexOf(current));
  return `<table role="presentation" width="100%" style="margin:6px 0 0"><tr>
    ${steps
      .map(([name, sub], i) => {
        const done = i <= at;
        const now = i === at;
        return `<td width="25%" valign="top" style="padding:0 6px 0 0">
          <div style="height:3px;background:${done ? INK : LINE};border-radius:2px"></div>
          <div style="font-family:${SANS};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${done ? INK : FAINT};margin-top:11px;font-weight:${now ? 600 : 400}">${name}</div>
          <div style="font-family:${SANS};font-size:11px;color:${done ? MUTED : FAINT};margin-top:5px;line-height:1.5">${sub}</div>
        </td>`;
      })
      .join('')}
  </tr></table>`;
}

export async function shipmentEmail(order, items, status) {
  const copy = STATUS_COPY[status] || STATUS_COPY.shipped;
  const first = (order.full_name || '').trim().split(' ')[0] || 'there';
  const count = items.reduce((t, i) => t + i.qty, 0);
  const track = order.lookup_token
    ? `${SITE}/order/${order.id}?t=${order.lookup_token}`
    : `${SITE}/order-lookup`;
  const orderNo = String(order.id).slice(0, 8).toUpperCase();

  const subject = copy.subject(count);
  const preheader = order.tracking_number
    ? `${order.courier || 'Courier'} · ${order.tracking_number}. Order ${orderNo}.`
    : `Order ${orderNo} — ${copy.kicker.toLowerCase()}.`;

  const consignment =
    status === 'shipped' && (order.tracking_number || order.courier)
      ? `<tr><td style="padding:0 0 18px">
          <table role="presentation" width="100%" style="background:${INK};border-radius:4px"><tr><td style="padding:30px 32px">
            ${kicker('Consignment', '#8A8A85')}
            <table role="presentation" width="100%" style="margin-top:18px"><tr>
              <td valign="top">
                <div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#8A8A85">Courier</div>
                <div style="font-family:${SERIF};font-size:26px;color:#FFFFFF;margin-top:8px">${order.courier || 'In transit'}</div>
              </td>
              <td valign="top">
                <div style="font-family:${SANS};font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#8A8A85">Tracking number</div>
                <div style="font-family:${SANS};font-size:16px;letter-spacing:0.06em;color:#FFFFFF;margin-top:12px">${order.tracking_number || '—'}</div>
              </td>
            </tr></table>
          </td></tr></table>
        </td></tr>`
      : '';

  const body = `
    ${card(
      `${kicker(`${copy.kicker} · order ${orderNo}`, FAINT)}
       <div style="font-family:${SERIF};font-weight:300;font-size:40px;line-height:1.1;color:${INK};margin:18px 0 18px">${copy.head}</div>
       <div style="font-family:${SANS};font-size:14px;line-height:1.85;color:${MUTED};margin-bottom:30px">
         ${first}, ${copy.line(count)}
       </div>
       ${timeline(status)}
       ${order.status_note ? `<div style="font-family:${SERIF};font-style:italic;font-size:18px;color:#4A4A47;margin-top:26px">${order.status_note}</div>` : ''}
       <div style="margin-top:30px">${button('Track this order →', track)}</div>`,
      '#FFFFFF',
      '38px 34px'
    )}

    ${consignment}

    <tr><td style="padding:0 0 4px">${kicker('Travelling with you')}</td></tr>
    <tr><td style="padding:14px 0 4px">${items.map(passportCard).join('')}</td></tr>

    ${card(
      `<div style="font-family:${SERIF};font-style:italic;font-size:19px;line-height:1.5;color:#4A4A47">${copy.note}</div>
       ${
         order.address
           ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid ${LINE}">
               ${kicker('Deliver to', FAINT)}
               <div style="font-family:${SANS};font-size:13px;line-height:1.8;color:#4A4A47;margin-top:10px">
                 ${order.full_name}<br>${[order.address, order.city, order.state, order.pin].filter(Boolean).join(', ')}
                 ${order.mobile ? `<br>${order.mobile}` : ''}
               </div>
             </div>`
           : ''
       }`,
      CREAM
    )}
  `;

  const text = `${copy.kicker.toUpperCase()} — The Nomad

${copy.head}

Order ${orderNo}${order.courier ? ` · ${order.courier}` : ''}${order.tracking_number ? ` · ${order.tracking_number}` : ''}

${items.map((i) => `${i.product.name} × ${i.qty} — ${i.product.object_no}`).join('\n')}

${order.status_note || copy.note}

TRACK THIS ORDER
${track}

© 2026 The Nomad · New Delhi`;

  return {
    subject,
    html: shell({
      preheader,
      body,
      footerNote: copy.note,
      why: `You are receiving this because you placed order ${orderNo} with us. It is a record of
             that order, not a mailing list.`,
    }),
    text,
  };
}

/* ─────────────────────────  6 · IT LANDED  ───────────────────────── */

export async function landedEmail(item, product, token) {
  const unsub = unsubUrl(token);
  const subject = `It landed — the ${item.name} is on the shelf`;
  const preheader = `${item.obj_no || product.object_no} cleared customs. ${
    product.stock > 0 ? `${product.stock} of them, and no more.` : 'Sold out already, we are sorry to say.'
  }`;

  const body = `
    ${card(
      `${kicker('Landed · you asked to be told', FAINT)}
       <div style="font-family:${SERIF};font-weight:300;font-size:40px;line-height:1.1;color:${INK};margin:18px 0 18px">${product.name}</div>
       <img src="${mailImg(product, 1072, 670)}" width="536" alt="${product.name}" style="display:block;width:100%;max-width:536px;height:auto;border-radius:3px;margin-bottom:22px">
       <div style="font-family:${SANS};font-size:14px;line-height:1.85;color:#4A4A47">${product.description}</div>
       <table role="presentation" width="100%" style="margin-top:22px;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE}"><tr>
         <td style="padding:18px 0">
           ${kicker('Origin', FAINT)}
           <div style="font-family:${SANS};font-size:13px;color:${INK};margin-top:8px">${product.city}, ${product.country}</div>
         </td>
         <td style="padding:18px 0">
           ${kicker('Coordinates', FAINT)}
           <div style="font-family:${SANS};font-size:13px;color:${INK};margin-top:8px">${deg(product.lat, 'N', 'S')} / ${deg(product.lon, 'E', 'W')}</div>
         </td>
         <td align="right" style="padding:18px 0">
           ${kicker('Price', FAINT)}
           <div style="font-family:${SANS};font-size:16px;color:${INK};margin-top:8px">${inr(product.price)}</div>
         </td>
       </tr></table>
       <div style="font-family:${SANS};font-size:13px;line-height:1.8;color:${MUTED};margin-top:20px">
         ${
           product.stock > 0
             ? `We came back with ${product.stock}. There will not be more of this batch — the next
                one, if there is a next one, will be a slightly different colour.`
             : `We came back with a handful and they have already gone. We have written to the maker
                about a second batch; no promises.`
         }
       </div>
       <div style="margin-top:28px">${button(product.stock > 0 ? 'See the object →' : 'See the object →', `${SITE}/product/${product.slug}`)}</div>`,
      '#FFFFFF',
      '38px 34px'
    )}

    ${card(
      `${kicker('Still in transit', FAINT)}
       <div style="font-family:${SANS};font-size:13px;line-height:1.8;color:${MUTED};margin-top:12px">
         Everything else we are waiting on — customs sheds, ferries, one very slow post office — is listed here.
       </div>
       <div style="margin-top:20px">${button('See what is on its way →', `${SITE}/soon`, '#FFFFFF', INK)}</div>`,
      SAND
    )}
  `;

  const text = `IT LANDED — The Nomad

${product.name} — ${inr(product.price)}
${product.city}, ${product.country} · ${product.material}
${product.stock > 0 ? `${product.stock} available.` : 'Already sold out.'}

${product.description}

${SITE}/product/${product.slug}

You asked to be told when the ${item.name} landed. This is that email.
© 2026 The Nomad · New Delhi`;

  return {
    subject,
    html: shell({
      preheader,
      body,
      footerNote: 'It took four months and two customs brokers. Here it is.',
      why: `You are receiving this because you asked to be told when the ${item.name} landed.`,
      unsub,
    }),
    text,
  };
}

/* ─────────────────────────  7 · DROP DAY  ───────────────────────── */

export async function dropDayEmail(drop, products, token) {
  const unsub = unsubUrl(token);
  const city = drop.city;
  const no = drop.drop_no;
  const line = products.slice(0, 4);

  const subject = `${no} is live — ${city}, and nothing restocked`;
  const preheader = `${drop.note || `Objects from ${city}`}. Open now. When they are gone, they are gone.`;

  const body = `
    <tr><td style="padding:0 0 18px">
      <table role="presentation" width="100%" style="background:${INK};border-radius:4px"><tr><td style="padding:44px 34px">
        ${kicker('Open now', '#8A8A85')}
        <div style="font-family:${SERIF};font-weight:300;font-size:46px;line-height:1.05;color:#FFFFFF;margin:18px 0 18px">${no} — ${city}.</div>
        <div style="font-family:${SANS};font-size:14px;line-height:1.85;color:#B4B0A6;margin-bottom:30px">
          ${drop.note ? `${drop.note}. ` : ''}Released all at once, as always. Nothing is restocked and
          nothing is discounted, so the only thing to decide is whether you want it.
        </div>
        ${button('Open the drop →', `${SITE}/shop`, '#FFFFFF', INK)}
      </td></tr></table>
    </td></tr>

    ${
      line.length
        ? card(
            `${kicker('A few of them')}
             <div style="margin-top:16px">${line.map((p) => productRow(p, p.stock <= 4 ? `${p.stock} only` : '')).join('')}</div>
             <div style="margin-top:26px">${button('See everything →', `${SITE}/shop`)}</div>`
          )
        : ''
    }

    ${card(
      `<div style="font-family:${SERIF};font-style:italic;font-size:20px;line-height:1.5;color:#4A4A47">
        We buy what we would keep. That is the whole method, and it is why there are never very many.
       </div>`,
      CREAM
    )}
  `;

  const text = `${no.toUpperCase()} — ${city.toUpperCase()} IS LIVE

${drop.note || ''}
Released all at once. Nothing restocked, nothing discounted.

${line.map((p) => `${p.name} — ${inr(p.price)} (${p.city}, ${p.country})`).join('\n')}

${SITE}/shop

© 2026 The Nomad · New Delhi
${unsub ? `Unsubscribe: ${unsub}` : ''}`;

  return {
    subject,
    html: shell({ preheader, body, footerNote: 'When they are gone, they are gone.', unsub }),
    text,
  };
}
