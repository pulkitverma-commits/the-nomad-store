'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession } from '@/lib/customerAuth';

const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';
const RED = '#B3402A';

const kicker = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: MUTED,
};

function reasonFor(error) {
  const code = String(error?.code || '');
  if (code === 'PGRST202' || code === '42883') return 'missing';
  if (code === '42501' || code === 'PGRST301' || error?.status === 401 || error?.status === 403)
    return 'denied';
  return 'error';
}

const REASON_COPY = {
  missing:
    'We cannot read your letter preferences here yet. Every letter we send still carries an unsubscribe link at the foot of it, and that always works.',
  denied:
    'We could not read your preferences just now. Signing out and back in usually settles it.',
  error: 'We could not reach your preferences just now. Please try again in a moment.',
};

function Toggle({ on, busy, onClick, title, blurb }) {
  return (
    <div
      onClick={busy ? undefined : onClick}
      style={{
        cursor: busy ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        padding: '26px 0',
        borderBottom: `1px solid ${LINE}`,
        opacity: busy ? 0.55 : 1,
        transition: 'opacity .2s',
      }}
    >
      <span
        style={{
          width: 34,
          height: 18,
          borderRadius: 9,
          background: on ? INK : '#DEDBD3',
          position: 'relative',
          flex: 'none',
          marginTop: 3,
          transition: 'background .25s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#FFFFFF',
            transition: 'left .25s',
          }}
        />
      </span>
      <span>
        <span style={{ fontSize: 15, display: 'block' }}>{title}</span>
        <span
          style={{
            fontSize: 13,
            color: MUTED,
            lineHeight: 1.8,
            display: 'block',
            marginTop: 8,
            maxWidth: '54ch',
          }}
        >
          {blurb}
        </span>
      </span>
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: on ? INK : FAINT,
          whiteSpace: 'nowrap',
          paddingTop: 4,
        }}
      >
        {on ? 'On' : 'Off'}
      </span>
    </div>
  );
}

export default function EmailsClient() {
  const sb = supabaseBrowser();
  const { session, email, loading } = useCustomerSession();

  const [prefs, setPrefs] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | unavailable
  const [reason, setReason] = useState('error');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return undefined;
    if (!session) {
      setState('unavailable');
      setReason('denied');
      return undefined;
    }
    let alive = true;
    (async () => {
      try {
        const { data, error: e } = await sb.rpc('my_email_prefs');
        if (!alive) return;
        if (e || !data || typeof data !== 'object') {
          setState('unavailable');
          setReason(e ? reasonFor(e) : 'error');
          return;
        }
        setPrefs(data);
        setState('ready');
      } catch (err) {
        if (alive) {
          setState('unavailable');
          setReason('error');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [sb, session, loading]);

  // The toggle moves at once — waiting on a round trip to see a switch flip
  // reads as a broken switch — but the server's answer is what we keep.
  const write = async (newsletter, drops) => {
    const previous = prefs;
    setPrefs({ ...prefs, newsletter, drops, unsubscribed: !newsletter && !drops });
    setBusy(true);
    setError('');
    try {
      const { data, error: e } = await sb.rpc('set_email_prefs', {
        p_newsletter: newsletter,
        p_drops: drops,
      });
      if (e) throw e;
      if (data && typeof data === 'object') setPrefs(data);
    } catch (e) {
      setPrefs(previous);
      setError('That did not save. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const shown = email || prefs?.email || '';
  const newsletter = !!prefs?.newsletter;
  const drops = !!prefs?.drops;
  const silent = state === 'ready' && !newsletter && !drops;

  return (
    <div>
      <div style={{ marginBottom: 44 }}>
        <div style={{ ...kicker, marginBottom: 18 }}>Letters</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 54, lineHeight: 1.05, margin: '0 0 16px' }}>
          What we send you
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: 0, maxWidth: '56ch' }}>
          Two lists, and nothing else. This page governs the address you signed in with —{' '}
          <span style={{ color: INK }}>{shown || 'your account address'}</span>. Changing it here
          changes it everywhere.
        </p>
      </div>

      {state === 'loading' && (
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT }}>
          Reading your preferences…
        </div>
      )}

      {state === 'unavailable' && (
        <div style={{ border: `1px solid ${LINE}`, padding: '30px 32px', maxWidth: '58ch' }}>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: MUTED, margin: '0 0 22px' }}>
            {REASON_COPY[reason]}
          </p>
          <Link
            href="/unsubscribe"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            Unsubscribe by email address →
          </Link>
        </div>
      )}

      {state === 'ready' && (
        <>
          <div style={{ borderTop: `1px solid ${INK}`, maxWidth: 760 }}>
            <Toggle
              on={newsletter}
              busy={busy}
              onClick={() => write(!newsletter, drops)}
              title="The letter"
              blurb="Once or twice a month. Where we have been, what came back with us, and the occasional note from a workshop. No offers, because we do not run any."
            />
            <Toggle
              on={drops}
              busy={busy}
              onClick={() => write(newsletter, !drops)}
              title="Drop days"
              blurb="A short note the morning a collection goes up, and nothing in between. Most drops are under ten pieces, so this is the only reliable way to be there for one."
            />
          </div>

          {error && <div style={{ fontSize: 12, color: RED, marginTop: 22 }}>{error}</div>}

          {silent && (
            <div
              style={{
                background: '#FCF7E8',
                border: '1px solid #F2E38F',
                padding: '22px 26px',
                marginTop: 32,
                maxWidth: 760,
              }}
            >
              <div style={{ ...kicker, fontSize: 9, marginBottom: 12 }}>Both off</div>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: MUTED, margin: 0 }}>
                We stop writing to you entirely. No letter, no drop day, no quiet exception we
                thought you would not mind. If you ever want back in, this page is where it happens
                — turning either one on is enough.
              </p>
            </div>
          )}

          <div style={{ marginTop: 48, paddingTop: 26, borderTop: `1px solid ${LINE}`, maxWidth: 760 }}>
            <div style={{ ...kicker, fontSize: 9, marginBottom: 14 }}>What this does not cover</div>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: MUTED, margin: '0 0 16px' }}>
              Order confirmations, shipping and delivery notices, and answers to something you have
              written to us are not marketing. They are part of the order itself, so they are sent
              whatever these two switches say — you would rightly be annoyed to be kept in the dark
              about a parcel you had paid for.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: FAINT, margin: 0 }}>
              Sign-in links are the same: they only ever arrive because you have just asked for one.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
