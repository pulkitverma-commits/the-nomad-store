'use client';
import { useState } from 'react';

export default function SubscribeForm({ source = 'newsletter', dark = false, cta }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');

  const submit = async () => {
    if (!/.+@.+\..+/.test(email)) return setState('invalid');
    setState('sending');
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      setState(r.ok ? 'done' : 'error');
    } catch (e) {
      setState('error');
    }
  };

  const line = dark ? '1px solid #4A4A47' : '1px solid #111111';
  const color = dark ? '#FFFFFF' : '#111111';
  if (state === 'done')
    return (
      <div className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: dark ? '#B4B0A6' : '#6B6B68' }}>
        Thank you — a postcard is on its way.
      </div>
    );
  return (
    <div style={{ display: 'flex', borderBottom: line, paddingBottom: 11, minWidth: 0 }}>
      <input
        placeholder={state === 'invalid' ? 'Please enter a valid email' : 'Email address'}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="input-line"
        style={{ color }}
      />
      <div
        onClick={submit}
        style={{
          cursor: 'pointer',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {state === 'sending' ? 'Sending…' : cta || 'Subscribe →'}
      </div>
    </div>
  );
}
