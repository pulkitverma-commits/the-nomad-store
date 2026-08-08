'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession, useEnabledProviders } from '@/lib/customerAuth';

const label = {
  fontSize: 10,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: '#6B6B68',
};

export default function SignInClient() {
  const sb = supabaseBrowser();
  const router = useRouter();
  const params = useSearchParams();
  const { session, loading } = useCustomerSession();
  const { live, pending } = useEnabledProviders();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Only ever bounce to a path on this site — an open redirect here would let
  // a crafted link send somebody's fresh session somewhere else.
  const raw = params.get('next') || '/account';
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/account';

  useEffect(() => {
    if (session) router.replace(next);
  }, [session, next, router]);

  const sendLink = async () => {
    setError('');
    if (!/.+@.+\..+/.test(email)) return setError('That does not look like an email address.');
    setBusy(true);
    const { error: e } = await sb.auth.signInWithOtp({
      email,
      options: {
        // Customers may not have an account yet — unlike the back office, this
        // form is also how you get one.
        shouldCreateUser: true,
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}${next}` : undefined,
      },
    });
    setBusy(false);
    if (e) setError(e.message);
    else setSent(true);
  };

  const oauth = (p) => async () => {
    setError('');
    const { error: e } = await sb.auth.signInWithOAuth({
      provider: p.key,
      options: {
        redirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}${next}` : undefined,
      },
    });
    if (e) setError(`${p.name} sign-in is not switched on yet.`);
  };

  if (loading || session) return null;

  return (
    <main style={{ maxWidth: 460, margin: '0 auto', padding: '110px 24px 0' }}>
      <div style={{ ...label, letterSpacing: '0.3em', marginBottom: 20 }}>The Nomad</div>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 54, lineHeight: 1.05, margin: '0 0 20px' }}>
        {sent ? 'Check your inbox' : 'Sign in'}
      </h1>

      {sent ? (
        <>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', margin: '0 0 30px' }}>
            We sent a link to <span style={{ color: '#111111' }}>{email}</span>. Open it on this
            device and you will land straight in your account. It works once, and only for the next
            hour.
          </p>
          <button
            onClick={() => setSent(false)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#6B6B68',
              textDecoration: 'underline',
            }}
          >
            Use a different address
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', margin: '0 0 34px' }}>
            No password. Give us the address you order with and we will send a link — it signs you
            in and pulls in anything you have bought before.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              style={{
                width: '100%',
                border: '1px solid #E8E8E5',
                background: '#FFFFFF',
                padding: '15px 16px',
                fontSize: 14,
                outline: 'none',
              }}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !busy && sendLink()}
            />
            <button
              onClick={sendLink}
              disabled={busy}
              style={{
                background: '#111111',
                color: '#FFFFFF',
                border: 'none',
                padding: 16,
                cursor: busy ? 'default' : 'pointer',
                font: 'inherit',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Sending…' : 'Email me a link'}
            </button>

            {live.length > 0 && (
              <>
                <div style={{ ...label, textAlign: 'center', margin: '10px 0 2px', color: '#B4B0A6' }}>
                  or
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {live.map((p) => (
                    <button
                      key={p.key}
                      onClick={oauth(p)}
                      style={{
                        background: 'none',
                        border: '1px solid #E8E8E5',
                        padding: 15,
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            {live.length === 0 && pending.length > 0 && (
              <div style={{ fontSize: 11, lineHeight: 1.7, color: '#B4B0A6' }}>
                {pending.map((p) => p.name).join(', ')} sign-in appear here once switched on.
              </div>
            )}
          </div>
        </>
      )}

      {error && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 20 }}>{error}</div>}

      <div style={{ marginTop: 44, paddingTop: 22, borderTop: '1px solid #E8E8E5' }}>
        <p style={{ fontSize: 12, lineHeight: 1.8, color: '#B4B0A6', margin: 0 }}>
          You never needed an account to order, and you still do not. If you have only ever checked
          out as a guest,{' '}
          <Link href="/order-lookup" className="underline-link" style={{ color: '#6B6B68' }}>
            look an order up
          </Link>{' '}
          with its number instead.
        </p>
      </div>
      <div style={{ height: 140 }} />
    </main>
  );
}
