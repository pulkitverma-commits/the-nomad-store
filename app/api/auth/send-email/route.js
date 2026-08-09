import { NextResponse } from 'next/server';
import { verifyStandardWebhook } from '@/lib/standardWebhook';
import { buildAuthEmail, confirmationUrl } from '@/lib/authMail';
import { sendMail } from '@/lib/mail';
import { SUPABASE_URL } from '@/lib/supabase';

// Supabase Auth "Send Email" hook.
//
// Supabase POSTs here instead of sending the mail itself, and we send it
// through the Mandrill API with tracking off. The reason is narrow and worth
// stating: over SMTP, Mandrill rewrites every link through
// mandrillapp.com/track/click, and a corporate link scanner that pre-fetches
// that URL spends the one-time sign-in token before the customer ever clicks.
// Mandrill's account-level "no click tracking" default does not apply to its
// SMTP relay — tested repeatedly on 8 Aug 2026 — so the only reliable control
// is the per-message flag, which the API path gives us.
//
// Contract: respond 200 and Supabase reports success to the caller. Respond
// non-200 and the sign-in attempt fails visibly. So a failure here must be a
// real failure — never swallow a send error into a 200.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOOK_SECRET =
  process.env.SEND_EMAIL_HOOK_SECRET || process.env.SEND_EMAIL_HOOK_SECRETS || '';

function fail(status, message) {
  // Supabase surfaces `error.message` in its logs; keep it terse and free of
  // anything an attacker could use to probe the secret.
  return NextResponse.json({ error: { http_code: status, message } }, { status });
}

export async function POST(req) {
  // The signature covers the raw bytes. Read as text, parse afterwards.
  const raw = await req.text();

  const headers = {};
  req.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });

  const verdict = verifyStandardWebhook(raw, headers, HOOK_SECRET);
  if (!verdict.ok) {
    console.error('[auth-hook] rejected:', verdict.reason);
    return fail(401, 'invalid signature');
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, 'malformed payload');
  }

  const email = body?.user?.email;
  const d = body?.email_data || {};
  if (!email) return fail(400, 'no recipient');

  const url = confirmationUrl({
    supabaseUrl: SUPABASE_URL,
    tokenHash: d.token_hash_new || d.token_hash,
    emailActionType: d.email_action_type,
    redirectTo: d.redirect_to || d.site_url,
  });

  const built = buildAuthEmail({
    emailActionType: d.email_action_type,
    url,
    token: d.token_new || d.token,
    newEmail: body?.user?.new_email,
  });

  if (!built) {
    // An action type we have no template for. Better to fail loudly than to
    // send a customer a blank or wrong-looking security email.
    console.error('[auth-hook] no template for action type:', d.email_action_type);
    return fail(400, `unsupported email action: ${d.email_action_type}`);
  }

  try {
    await sendMail({
      to: email,
      subject: built.subject,
      html: built.html,
      text: built.text,
      kind: built.kind,
      tags: ['auth', built.kind],
      // Account mail must reach someone who has unsubscribed from the
      // newsletter — you cannot opt out of being able to sign in.
      transactional: true,
      // The entire reason this route exists.
      track: false,
    });
  } catch (e) {
    console.error('[auth-hook] send failed:', e.message);
    return fail(500, 'could not send email');
  }

  return NextResponse.json({});
}
