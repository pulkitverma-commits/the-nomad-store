import crypto from 'node:crypto';

// Verifies a Standard Webhooks signature (https://www.standardwebhooks.com/),
// which is what Supabase Auth uses to sign HTTP hook requests.
//
// Implemented here rather than pulling in the `standardwebhooks` package: it is
// one HMAC and a constant-time compare, and this route is the only thing
// standing between the public internet and our ability to send mail as The
// Nomad. Small enough to read in full is worth more than a dependency.
//
// The signed content is `${id}.${timestamp}.${payload}` — the RAW request body,
// byte for byte. Re-serialising parsed JSON will not match.

const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  // Comparing digests of equal-length inputs keeps it constant time.
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * @param {string} payload   raw request body
 * @param {object} headers   lowercase header map
 * @param {string} secret    the `v1,whsec_...` value from Supabase, or the bare
 *                           base64 portion. Multiple secrets may be separated
 *                           by `|` to allow rotation.
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function verifyStandardWebhook(payload, headers, secret) {
  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signature = headers['webhook-signature'];

  if (!id || !timestamp || !signature) return { ok: false, reason: 'missing signature headers' };
  if (!secret) return { ok: false, reason: 'hook secret not configured' };

  // Replay window. Without this a captured request stays valid forever.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad timestamp' };
  const drift = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (drift > DEFAULT_TOLERANCE_SECONDS) return { ok: false, reason: 'timestamp outside tolerance' };

  const signedContent = `${id}.${timestamp}.${payload}`;

  // Supabase may hold several secrets during rotation, `|` separated. Each may
  // or may not carry the `v1,whsec_` prefix depending on how it was copied.
  const candidates = String(secret)
    .split('|')
    .map((s) => s.trim().replace(/^v1,whsec_/, '').replace(/^whsec_/, ''))
    .filter(Boolean)
    .map((b64) => {
      const key = Buffer.from(b64, 'base64');
      return crypto.createHmac('sha256', key).update(signedContent).digest('base64');
    });

  // The header carries one or more space-separated `v1,<base64>` signatures.
  const provided = String(signature)
    .split(' ')
    .map((part) => {
      const comma = part.indexOf(',');
      return comma === -1 ? part : part.slice(comma + 1);
    })
    .filter(Boolean);

  for (const expected of candidates) {
    for (const got of provided) {
      if (timingSafeEqualStr(expected, got)) return { ok: true };
    }
  }
  return { ok: false, reason: 'signature mismatch' };
}
