'use client';
import Link from 'next/link';
import { useUi } from './Ui';
import { inr, productImg } from '@/lib/format';

export default function BagDrawer() {
  const { bag, bagOpen, setBagOpen, setQty, removeItem } = useUi();
  if (!bagOpen) return null;
  const total = bag.reduce((t, b) => t + b.price * b.qty, 0);
  const label = (s) => ({
    fontSize: 11,
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    ...s,
  });
  return (
    <>
      <div
        onClick={() => setBagOpen(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.28)', zIndex: 80 }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(430px, 100vw)',
          background: '#FFFFFF',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          animation: 'ndrawer .38s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '26px 32px',
            borderBottom: '1px solid #E8E8E5',
          }}
        >
          <div style={label({})}>Your Bag</div>
          <div
            onClick={() => setBagOpen(false)}
            style={label({ cursor: 'pointer', letterSpacing: '0.16em', color: '#6B6B68' })}
          >
            Close
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px' }}>
          {bag.length === 0 && (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div className="serif" style={{ fontSize: 30, lineHeight: 1.3, marginBottom: 16 }}>
                Nothing collected yet
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: '#6B6B68', marginBottom: 28 }}>
                Your bag is empty. There are 42 objects waiting from 18 countries.
              </div>
              <Link
                href="/shop"
                className="underline-link"
                onClick={() => setBagOpen(false)}
                style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
              >
                Start exploring →
              </Link>
            </div>
          )}
          {bag.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '84px 1fr',
                gap: 20,
                padding: '26px 0',
                borderBottom: '1px solid #F2F1ED',
              }}
            >
              <div style={{ aspectRatio: '4/5', background: b.tone || '#F2F1ED', overflow: 'hidden' }}>
                {b.photo_id && (
                  <img
                    src={productImg(b, 200)}
                    alt={b.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{inr(b.price * b.qty)}</div>
                </div>
                <div style={{ fontSize: 11, color: '#6B6B68', marginTop: 6 }}>{b.origin}</div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#B4B0A6',
                    marginTop: 10,
                  }}
                >
                  {b.object_no}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      border: '1px solid #E8E8E5',
                      padding: '5px 12px',
                    }}
                  >
                    <span
                      onClick={() => setQty(b.id, b.qty - 1)}
                      style={{ cursor: 'pointer', fontSize: 13, color: '#6B6B68' }}
                    >
                      −
                    </span>
                    <span style={{ fontSize: 13 }}>{b.qty}</span>
                    <span
                      onClick={() => setQty(b.id, b.qty + 1)}
                      style={{ cursor: 'pointer', fontSize: 13, color: '#6B6B68' }}
                    >
                      +
                    </span>
                  </div>
                  <div
                    onClick={() => removeItem(b.id)}
                    style={{
                      cursor: 'pointer',
                      fontSize: 10,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#B4B0A6',
                    }}
                  >
                    Remove
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {bag.length > 0 && (
          <div style={{ borderTop: '1px solid #E8E8E5', padding: '26px 32px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
                marginBottom: 8,
              }}
            >
              <span>Subtotal</span>
              <span>{inr(total)}</span>
            </div>
            <div style={{ fontSize: 11, color: '#6B6B68', marginBottom: 22 }}>
              Shipping calculated at checkout.
            </div>
            <Link
              href="/checkout"
              onClick={() => setBagOpen(false)}
              className="btn-dark"
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: 19,
                color: '#FFFDF4',
              }}
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
