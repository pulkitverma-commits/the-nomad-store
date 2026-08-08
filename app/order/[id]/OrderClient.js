'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { inr, productImg } from '@/lib/format';

export default function OrderClient({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem('nomad-last-order');
      if (saved) {
        const o = JSON.parse(saved);
        if (o.id === orderId) setOrder(o);
      }
    } catch (e) {}
    setLoaded(true);
  }, [orderId]);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '90px 40px 0' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 22 }}>
        Order confirmed
      </div>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 64, lineHeight: 1.05, margin: '0 0 24px' }}>
        {order ? `Thank you, ${order.name.split(' ')[0]}.` : 'Thank you.'}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', maxWidth: '54ch', margin: '0 0 48px' }}>
        Your objects are being wrapped in unbleached paper, each with its passport card.
        {order?.email ? ` A confirmation is on its way to ${order.email}.` : ''} This is a
        demonstration store, so no payment was collected.
      </p>

      <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E5', padding: 40, marginBottom: 60 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '1px solid #111111',
            paddingBottom: 14,
            marginBottom: 26,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            The Nomad Order Passport
          </div>
          <div className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: '#6B6B68' }}>TN</div>
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 8 }}>
          Order no.
        </div>
        <div className="serif" style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 28, wordBreak: 'break-all' }}>
          {orderId}
        </div>
        {order && (
          <>
            {order.items.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr auto',
                  gap: 16,
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid #F2F1ED',
                }}
              >
                <div style={{ aspectRatio: '1', background: b.tone || '#F2F1ED', overflow: 'hidden' }}>
                  {b.photo_id && (
                    <img
                      src={productImg(b, 120)}
                      alt={b.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13 }}>
                    {b.name}
                    {b.qty > 1 ? ` × ${b.qty}` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B6B68', marginTop: 4 }}>{b.object_no}</div>
                </div>
                <div style={{ fontSize: 13 }}>{inr(b.price * b.qty)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '22px 0 0', fontSize: 16 }}>
              <span>Total {order.payment_method ? `· ${order.payment_method}` : ''}</span>
              <span>{inr(order.total)}</span>
            </div>
          </>
        )}
        {!order && loaded && (
          <div style={{ fontSize: 13, color: '#6B6B68' }}>
            Order recorded. Keep this order number for reference.
          </div>
        )}
        <div
          className="serif"
          style={{ marginTop: 30, paddingTop: 20, borderTop: '1px dotted #E8E8E5', fontStyle: 'italic', fontSize: 16, color: '#6B6B68' }}
        >
          Thank you for giving these objects a new home.
        </div>
      </div>

      <Link href="/shop" className="underline-link" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        Continue exploring →
      </Link>
    </main>
  );
}
