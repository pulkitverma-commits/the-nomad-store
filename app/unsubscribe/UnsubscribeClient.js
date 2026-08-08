'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';

const kicker = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: MUTED,
};

const REASONS = [
  'Too many emails',
  'Not what I expected',
  'I never signed up',
  'Just tidying my inbox',
];

function Shell({ children }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '90px 40px 0' }}>
      {children}
      <div style={{ height: 120 }} />
    </main>
  );
}

export default function UnsubscribeClient() {
  const [token, setToken] = useState(null);
  const [info, setInfo] = useState(undefined); // undefined = loading, null = bad token
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState('confirm'); // confirm | done | back

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t') || '';
    setToken(t);
    if (!t) return setInfo(null);
    fetch(`/api/unsubscribe?t=${encodeURIComponent(t)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setInfo(d && d.ok ? d : null);
        if (d?.state === 'unsubscribed') setState('done');
      })
      .catch(() => setInfo(null));
  }, []);

  const unsubscribe = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: [reason, note].filter(Boolean).join(' — ') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not unsubscribe.');
      setState('done');
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const resubscribe = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/unsubscribe/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resubscribe.');
      setState('back');
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  if (info === undefined) {
    return (
      <Shell>
        <div style={kicker}>One moment</div>
      </Shell>
    );
  }

  if (info === null) {
    return (
      <Shell>
        <div style={{ ...kicker, marginBottom: 22 }}>Link not recognised</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 24px' }}>
          This link has expired.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 34px' }}>
          Either it has already been used, or the address it belonged to is no longer on our list —
          which means, either way, that we are not writing to you. If postcards keep arriving, reply
          to one of them and we will stop them by hand.
        </p>
        <Link
          href="/"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Back to The Nomad →
        </Link>
      </Shell>
    );
  }

  if (state === 'back') {
    return (
      <Shell>
        <div style={{ ...kicker, marginBottom: 22 }}>Back on the list</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 24px' }}>
          We will write again.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 34px' }}>
          {info.masked} is back on the postcards — twice a month, no more. The next one will find you
          in the usual way.
        </p>
        <Link
          href="/shop"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          See what has landed →
        </Link>
      </Shell>
    );
  }

  if (state === 'done') {
    return (
      <Shell>
        <div style={{ ...kicker, marginBottom: 22 }}>Unsubscribed</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 24px' }}>
          Done. No more postcards.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 20px' }}>
          {info.masked} has been taken off the list and added to our suppression list, which every
          send is checked against. It takes effect immediately, not in the customary ten days.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: FAINT, margin: '0 0 40px' }}>
          If you have an order with us, you will still receive emails about that order — a receipt is
          not a newsletter, and we would rather you knew where your parcel was.
        </p>

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 26 }}>
          <div className="serif" style={{ fontStyle: 'italic', fontSize: 19, color: '#4A4A47', marginBottom: 18 }}>
            Left in haste?
          </div>
          <span
            onClick={busy ? undefined : resubscribe}
            className="underline-link"
            style={{
              cursor: busy ? 'default' : 'pointer',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? 'One moment…' : 'Actually, resubscribe me →'}
          </span>
        </div>
        {error && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 20 }}>{error}</div>}
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ ...kicker, marginBottom: 22 }}>Unsubscribe</div>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 24px' }}>
        Stop the postcards?
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 12px' }}>
        This will remove <strong style={{ color: INK, fontWeight: 500 }}>{info.masked}</strong> from
        everything we send — the postcards and the drop list both. One click, no arguing.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: FAINT, margin: '0 0 40px' }}>
        Emails about an order you have placed will continue, because they are receipts rather than
        letters.
      </p>

      <div style={{ ...kicker, fontSize: 10, marginBottom: 14 }}>If you feel like saying why</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 16 }}>
        {REASONS.map((r) => (
          <span
            key={r}
            onClick={() => setReason(reason === r ? '' : r)}
            style={{
              cursor: 'pointer',
              fontSize: 12,
              padding: '9px 15px',
              border: `1px solid ${reason === r ? INK : LINE}`,
              background: reason === r ? INK : 'transparent',
              color: reason === r ? '#FFFDF4' : MUTED,
            }}
          >
            {r}
          </span>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional. We do read these."
        rows={3}
        style={{
          border: `1px solid ${LINE}`,
          background: '#FFFFFF',
          padding: '13px 15px',
          fontSize: 14,
          width: '100%',
          outline: 'none',
          fontFamily: 'inherit',
          resize: 'vertical',
          marginBottom: 30,
        }}
      />

      <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={unsubscribe}
          disabled={busy}
          style={{
            cursor: 'pointer',
            background: INK,
            color: '#FFFDF4',
            border: 'none',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '17px 30px',
            opacity: busy ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {busy ? 'Removing…' : 'Unsubscribe me'}
        </button>
        <Link
          href="/"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED }}
        >
          Keep them coming
        </Link>
      </div>
      {error && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 22 }}>{error}</div>}
    </Shell>
  );
}
