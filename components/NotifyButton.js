'use client';
import { useState } from 'react';

export default function NotifyButton({ itemName, boxed = false }) {
  const [state, setState] = useState('idle');
  const [email, setEmail] = useState('');

  const submit = async () => {
    if (!/.+@.+\..+/.test(email)) return;
    setState('sending');
    try {
      const r = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, item_name: itemName }),
      });
      setState(r.ok ? 'done' : 'idle');
    } catch (e) {
      setState('idle');
    }
  };

  if (state === 'done')
    return (
      <div className="serif" style={{ fontStyle: 'italic', fontSize: 16, color: '#6B6B68' }}>
        We will write to you when it lands.
      </div>
    );
  if (state === 'open' || state === 'sending')
    return (
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #111111', paddingBottom: 8, maxWidth: 280 }}>
        <input
          autoFocus
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="input-line"
          style={{ fontSize: 13 }}
        />
        <div
          onClick={submit}
          style={{ cursor: 'pointer', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
        >
          {state === 'sending' ? '…' : 'OK →'}
        </div>
      </div>
    );
  return boxed ? (
    <div
      onClick={() => setState('open')}
      style={{
        cursor: 'pointer',
        border: '1px solid #E8E8E5',
        padding: '14px 22px',
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#6B6B68',
        display: 'inline-block',
      }}
    >
      Notify me
    </div>
  ) : (
    <div
      onClick={() => setState('open')}
      className="underline-link"
      style={{ marginTop: 14, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}
    >
      Notify me
    </div>
  );
}
