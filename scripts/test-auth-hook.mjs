// Checks the Standard Webhooks verifier and the auth-mail builder without
// sending anything or needing a server. Run: node scripts/test-auth-hook.mjs
//
// The verifier is what stops the open internet from making us send mail as The
// Nomad, so the negative cases matter more than the positive one.

import crypto from 'node:crypto';
import { verifyStandardWebhook } from '../lib/standardWebhook.js';
import { buildAuthEmail, confirmationUrl } from '../lib/authMail.js';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

const SECRET_B64 = Buffer.from('a-test-secret-of-some-length').toString('base64');
const SECRET = `v1,whsec_${SECRET_B64}`;

function sign(payload, { id = 'msg_1', ts = Math.floor(Date.now() / 1000), secret = SECRET_B64 } = {}) {
  const sig = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(`${id}.${ts}.${payload}`)
    .digest('base64');
  return {
    'webhook-id': id,
    'webhook-timestamp': String(ts),
    'webhook-signature': `v1,${sig}`,
  };
}

console.log('\nsignature verification');
const payload = JSON.stringify({ user: { email: 'a@b.test' }, email_data: { token: '123456' } });

check('accepts a correctly signed payload', verifyStandardWebhook(payload, sign(payload), SECRET).ok);

check(
  'accepts the bare base64 secret too',
  verifyStandardWebhook(payload, sign(payload), SECRET_B64).ok
);

check(
  'rejects a tampered body',
  !verifyStandardWebhook(payload + ' ', sign(payload), SECRET).ok
);

check(
  'rejects a signature made with the wrong secret',
  !verifyStandardWebhook(payload, sign(payload, { secret: Buffer.from('nope').toString('base64') }), SECRET).ok
);

check(
  'rejects a replay outside the time window',
  !verifyStandardWebhook(payload, sign(payload, { ts: Math.floor(Date.now() / 1000) - 3600 }), SECRET).ok
);

check(
  'rejects a future timestamp outside the window',
  !verifyStandardWebhook(payload, sign(payload, { ts: Math.floor(Date.now() / 1000) + 3600 }), SECRET).ok
);

check('rejects missing headers', !verifyStandardWebhook(payload, {}, SECRET).ok);

check(
  'rejects when no secret is configured',
  !verifyStandardWebhook(payload, sign(payload), '').ok
);

check(
  'accepts an old signature during secret rotation',
  verifyStandardWebhook(payload, sign(payload), `${SECRET_B64}|${Buffer.from('other').toString('base64')}`).ok
);

check(
  'accepts when the header carries several signatures',
  (() => {
    const h = sign(payload);
    h['webhook-signature'] = `v1,ZmFrZQ== ${h['webhook-signature']}`;
    return verifyStandardWebhook(payload, h, SECRET).ok;
  })()
);

console.log('\nconfirmation url');
const url = confirmationUrl({
  supabaseUrl: 'https://proj.supabase.co',
  tokenHash: 'abc123',
  emailActionType: 'magiclink',
  redirectTo: 'https://the-nomad-store.vercel.app/account',
});
check('points at the verify endpoint', url.startsWith('https://proj.supabase.co/auth/v1/verify?'), url);
check('carries token, type and redirect', /token=abc123/.test(url) && /type=magiclink/.test(url) && /redirect_to=/.test(url), url);
check('url-encodes the redirect', url.includes('redirect_to=https%3A%2F%2F'), url);

console.log('\nemail bodies');
for (const type of ['magiclink', 'signup', 'invite', 'recovery', 'email_change', 'reauthentication']) {
  const built = buildAuthEmail({ emailActionType: type, url, token: '123456', newEmail: 'new@b.test' });
  check(`${type}: builds`, !!built);
  if (!built) continue;
  check(`${type}: no unrendered template tokens`, !/\{\{/.test(built.html));
  check(`${type}: carries the brand tagline`, built.html.includes('Collectibles worth bringing home'));
  check(`${type}: has a plain-text part`, !!built.text && built.text.length > 20);
  if (type === 'reauthentication') {
    check('reauth: shows the code, not a link', built.html.includes('123456') && !built.html.includes('/auth/v1/verify'));
  } else {
    check(`${type}: links to the verify url`, built.html.includes('/auth/v1/verify'));
  }
}

check('unknown action type returns null', buildAuthEmail({ emailActionType: 'nonsense', url }) === null);

check(
  'escapes html in the new-email field',
  !buildAuthEmail({
    emailActionType: 'email_change',
    url,
    newEmail: '<script>alert(1)</script>',
  }).html.includes('<script>')
);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
