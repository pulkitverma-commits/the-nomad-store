'use client';
import { useState } from 'react';
import Link from 'next/link';
import OrderPassport from '../order/[id]/OrderPassport';

const inputStyle = {
  border: '1px solid #E8E8E5',
  background: '#FFFFFF',
  padding: '14px 16px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: 10,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
  color: '#6B6B68',
  marginBottom: 9,
};

export default function LookupClient() {
  const [orderNo, setOrderNo] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_no: orderNo, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not look that up.');
      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (order) {
    return (
      <>
        <OrderPassport order={order} />
        <div style={{ maxWidth: 860, margin: '-60px auto 90px', padding: '0 40px' }}>
          <span
            onClick={() => {
              setOrder(null);
              setOrderNo('');
            }}
            className="underline-link"
            style={{
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#6B6B68',
            }}
          >
            Look up a different order
          </span>
        </div>
      </>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '90px 40px 0' }}>
      <div style={{ ...labelStyle, marginBottom: 22 }}>Find an order</div>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 60, lineHeight: 1.05, margin: '0 0 24px' }}>
        Where is it?
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', margin: '0 0 44px' }}>
        Every confirmation email carries a private link to the order. If that email has gone the way
        of most email, the order number and the address you gave us will do just as well.
      </p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={labelStyle}>Order number</div>
          <input
            style={inputStyle}
            placeholder="8 characters, e.g. 3F9A21C4"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <div style={labelStyle}>Email on the order</div>
          <input
            style={inputStyle}
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          style={{
            cursor: 'pointer',
            background: '#111111',
            color: '#FFFDF4',
            border: 'none',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '17px 26px',
            opacity: busy ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {busy ? 'Looking…' : 'Find my order'}
        </button>
      </form>

      {error && (
        <div style={{ fontSize: 13, color: '#B3402A', marginTop: 22, lineHeight: 1.7 }}>{error}</div>
      )}

      <div style={{ marginTop: 54, paddingTop: 26, borderTop: '1px solid #E8E8E5' }}>
        <div className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: '#6B6B68', lineHeight: 1.6 }}>
          Still nothing? Write to us at postcards@foxnetglobal.com and we will find it by hand.
        </div>
        <div style={{ marginTop: 22 }}>
          <Link
            href="/shop"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            Back to the objects →
          </Link>
        </div>
      </div>
      <div style={{ height: 110 }} />
    </main>
  );
}
