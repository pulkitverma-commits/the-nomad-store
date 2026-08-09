// The four emails Supabase Auth asks us to send, in The Nomad's house style.
//
// These used to live as pasted HTML inside the Supabase dashboard, sent over
// Mandrill's SMTP relay. They moved here because that path forced click
// tracking on the sign-in link and there was no way to turn it off: Mandrill's
// account-level sending defaults do not reach the SMTP tier (verified over 77
// minutes on 8 Aug 2026). Sending through the Mandrill API instead lets us set
// track_clicks per message — see the note in lib/mail.js.
//
// Everything visual here matches lib/mail.js so the sign-in mail and the order
// confirmation look like they came from the same shop.

const INK = '#111111';
const CREAM = '#FCF7E8';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Instrument Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://the-nomad-store.vercel.app';

// Escapes anything that reaches the HTML. `redirect_to` is attacker-influenced
// in principle, and the token strings come from Supabase, so nothing gets
// interpolated raw.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Rebuilds the link Supabase would have put in {{ .ConfirmationURL }}.
 *
 * Supabase does not hand the hook a finished URL — it hands over the pieces and
 * expects the verify endpoint to be assembled here. Getting this wrong is the
 * one way this whole path can break, so it is deliberately boring.
 */
export function confirmationUrl({ supabaseUrl, tokenHash, emailActionType, redirectTo }) {
  const u = new URL('/auth/v1/verify', supabaseUrl);
  u.searchParams.set('token', tokenHash);
  u.searchParams.set('type', emailActionType);
  if (redirectTo) u.searchParams.set('redirect_to', redirectTo);
  return u.toString();
}

function shell({ preheader, headline, lede, action, aside, footerNote }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<title>The Nomad</title></head>
<body style="margin:0;padding:0;background:${CREAM};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM}">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%">

    <tr><td style="padding:0 0 26px">
      <table role="presentation" width="100%"><tr>
        <td style="font-family:${SANS};font-size:13px;letter-spacing:0.42em;text-transform:uppercase;font-weight:600;color:${INK}">The Nomad</td>
        <td align="right" style="font-family:${SERIF};font-style:italic;font-size:16px;color:${MUTED}">Collectibles worth bringing home</td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:0 0 18px">
      <table role="presentation" width="100%" style="background:#FFFFFF;border-radius:4px"><tr><td style="padding:40px 34px">
        <div style="font-family:${SERIF};font-weight:300;font-size:38px;line-height:1.12;color:${INK};margin:0 0 18px">${headline}</div>
        <div style="font-family:${SANS};font-size:15px;line-height:1.8;color:${MUTED};margin:0 0 30px">${lede}</div>
        ${action}
        <div style="font-family:${SANS};font-size:11px;line-height:1.8;color:${FAINT};margin:30px 0 0;padding-top:22px;border-top:1px solid ${LINE}">
          ${aside}
        </div>
      </td></tr></table>
    </td></tr>

    <tr><td style="padding:16px 0 0">
      <table role="presentation" width="100%" style="border-top:1px solid ${LINE}">
        <tr><td style="padding:22px 0 0">
          <div style="font-family:${SERIF};font-style:italic;font-size:16px;color:${MUTED};margin-bottom:18px">${footerNote}</div>
          <div style="font-family:${SANS};font-size:11px;line-height:1.9;color:${FAINT}">
            <a href="${SITE}/shop" style="color:${MUTED};text-decoration:none">Objects</a> &nbsp;·&nbsp;
            <a href="${SITE}/world" style="color:${MUTED};text-decoration:none">World map</a> &nbsp;·&nbsp;
            <a href="${SITE}/journal" style="color:${MUTED};text-decoration:none">Journal</a> &nbsp;·&nbsp;
            <a href="${SITE}/drops" style="color:${MUTED};text-decoration:none">Drops</a>
          </div>
          <div style="font-family:${SANS};font-size:11px;line-height:1.8;color:${FAINT};margin-top:14px">
            © 2026 The Nomad · New Delhi<br>
            This is a security email about your account, so it is sent whether or not you take our letters.
          </div>
        </td></tr>
      </table>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

function button(label, href) {
  return `<a href="${href}" style="display:inline-block;background:${INK};color:#FFFDF4;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;padding:15px 30px;border-radius:999px;text-decoration:none">${label}</a>`;
}

function codePlate(token) {
  return `<div style="font-family:${SANS};font-size:30px;font-weight:600;letter-spacing:0.38em;color:${INK};background:${CREAM};border-radius:4px;padding:20px 24px;text-align:center">${esc(token)}</div>`;
}

function fallback(href) {
  return `Button not working? Paste this into your browser:<br>
          <a href="${href}" style="color:${MUTED};word-break:break-all;text-decoration:underline">${href}</a>`;
}

const ONCE_AND_HOUR =
  'The link works once, and only for the next hour.';

/**
 * Maps a Supabase email_action_type onto a finished message.
 *
 * Returns null for an action we do not have a template for, which the route
 * treats as "fall back to nothing rather than send something wrong". Supabase
 * currently sends: signup, magiclink, recovery, invite, email_change,
 * email_change_current, email_change_new, reauthentication.
 */
export function buildAuthEmail({ emailActionType, url, token, newEmail }) {
  const href = esc(url);
  const type = String(emailActionType || '');

  switch (type) {
    case 'magiclink':
      return {
        subject: 'Your sign-in link',
        kind: 'auth_magiclink',
        html: shell({
          preheader: 'Your sign-in link — good once, and for one hour.',
          headline: 'Come in.',
          lede:
            'This link signs you into The Nomad and pulls in everything you have ordered from us — including anything you bought before there was an account to put it in.',
          action: button('Sign in', href),
          aside: `${ONCE_AND_HOUR} If you did not ask to sign in, nothing has happened to your account — you can ignore this and the link will expire on its own.<br><br>${fallback(href)}`,
          footerNote: 'No password to forget. That is the whole idea.',
        }),
        text: `Sign in to The Nomad:\n\n${url}\n\nThe link works once, and only for the next hour. If you did not ask to sign in, ignore this — nothing has happened to your account.`,
      };

    case 'signup':
    case 'invite':
      return {
        subject: 'Confirm your address — The Nomad',
        kind: 'auth_signup',
        html: shell({
          preheader: 'Confirm your address and your account is open.',
          headline: 'One tap and you are in.',
          lede:
            'Confirm this is your address and we will open your account. Your orders, the countries you have collected, and anything you have saved will gather here.',
          action: button('Confirm and sign in', href),
          aside: `${ONCE_AND_HOUR} If you did not ask for an account, ignore this — nothing was created, and the link will expire on its own.<br><br>${fallback(href)}`,
          footerNote: 'You never needed an account to order. You still do not.',
        }),
        text: `Confirm your address for The Nomad:\n\n${url}\n\nThe link works once, and only for the next hour.`,
      };

    case 'recovery':
      return {
        subject: 'Getting back into your account',
        kind: 'auth_recovery',
        html: shell({
          preheader: 'A link to get back into your account.',
          headline: 'Let us get you back in.',
          lede:
            'Somebody asked for a way back into this account. This link does it, and nothing else changes until you use it.',
          action: button('Get back in', href),
          aside: `${ONCE_AND_HOUR} If it was not you, do nothing — your account is untouched and the link expires on its own.<br><br>${fallback(href)}`,
          footerNote: 'We would rather send a link than keep a password.',
        }),
        text: `Get back into your The Nomad account:\n\n${url}\n\nThe link works once, and only for the next hour.`,
      };

    case 'email_change':
    case 'email_change_new':
    case 'email_change_current':
      return {
        subject: 'Confirm your new address',
        kind: 'auth_email_change',
        html: shell({
          preheader: 'Confirm the new address on your account.',
          headline: 'A new address.',
          lede: newEmail
            ? `Someone asked to move The Nomad account to <span style="color:${INK}">${esc(newEmail)}</span>. Confirm below and future orders, receipts and sign-in links will come here instead.`
            : 'Someone asked to move The Nomad account to this address. Confirm below and future orders, receipts and sign-in links will come here instead.',
          action: button('Confirm this address', href),
          aside: `${ONCE_AND_HOUR} If this was not you, do nothing — the change will not take effect, and your existing address stays as it is.<br><br>${fallback(href)}`,
          footerNote: 'We only ever write to an address you have confirmed.',
        }),
        text: `Confirm your new address for The Nomad:\n\n${url}\n\nThe link works once, and only for the next hour.`,
      };

    case 'reauthentication':
      return {
        subject: `${token} is your confirmation code`,
        kind: 'auth_reauth',
        html: shell({
          preheader: `Your confirmation code: ${esc(token)}`,
          headline: 'Just checking it is you.',
          lede:
            'Type this code back into the window you left open. It is the last step before the change you asked for goes through.',
          action: codePlate(token),
          aside:
            'The code is good for the next hour and can only be used once. If you did not request it, you can ignore this — nothing will change on your account.',
          footerNote: 'Codes, briefly. Then never again.',
        }),
        text: `Your The Nomad confirmation code is ${token}. It is good for one hour and can only be used once.`,
      };

    default:
      return null;
  }
}
