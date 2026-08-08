import Link from 'next/link';
import { inr, productImg } from '@/lib/format';

// Shared by the server-rendered order page and the client-side order lookup.
// No hooks, no browser APIs — safe in both.

const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';

export const STEPS = [
  ['confirmed', 'Confirmed', 'Order taken'],
  ['packed', 'Packed', 'Wrapped by hand'],
  ['shipped', 'Shipped', 'With the courier'],
  ['delivered', 'Delivered', 'Home'],
];

const kicker = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: MUTED,
};

function Timeline({ status, updatedAt }) {
  const at = Math.max(
    0,
    STEPS.findIndex((s) => s[0] === (status || 'confirmed'))
  );
  return (
    <div style={{ margin: '0 0 34px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {STEPS.map(([key, name, sub], i) => {
          const done = i <= at;
          return (
            <div key={key}>
              <div
                style={{
                  height: 3,
                  background: done ? INK : LINE,
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginTop: 11,
                  color: done ? INK : FAINT,
                  fontWeight: i === at ? 600 : 400,
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: 11, color: done ? MUTED : FAINT, marginTop: 5 }}>{sub}</div>
            </div>
          );
        })}
      </div>
      {updatedAt && (
        <div style={{ fontSize: 11, color: FAINT, marginTop: 16 }}>
          Last updated {new Date(updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </div>
      )}
    </div>
  );
}

export default function OrderPassport({ order, showThanks = false }) {
  const items = order.items || [];
  const orderNo = String(order.id).slice(0, 8).toUpperCase();
  const first = (order.full_name || '').trim().split(' ')[0] || 'there';
  const count = items.reduce((t, i) => t + i.qty, 0);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '90px 40px 0' }}>
      <div style={{ ...kicker, marginBottom: 22 }}>
        {showThanks ? 'Order confirmed' : `Order ${orderNo}`}
      </div>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 64, lineHeight: 1.05, margin: '0 0 24px' }}>
        {showThanks ? `Thank you, ${first}.` : `${count} ${count === 1 ? 'object' : 'objects'}, in transit.`}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, maxWidth: '54ch', margin: '0 0 48px' }}>
        {order.status === 'delivered'
          ? 'Delivered. The passport card is in the paper, not the box — people throw the paper away.'
          : order.status === 'shipped'
            ? 'Handed to the courier. It will travel a great deal less far than it did to reach us.'
            : `Your ${count === 1 ? 'object is' : 'objects are'} being wrapped in unbleached paper, each with its passport card.`}
        {order.email ? ` We write to ${order.email} at every step.` : ''}
      </p>

      <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, padding: 40, marginBottom: 30 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: `1px solid ${INK}`,
            paddingBottom: 14,
            marginBottom: 30,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            The Nomad Order Passport
          </div>
          <div className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: MUTED }}>
            TN
          </div>
        </div>

        <Timeline status={order.status} updatedAt={order.status_updated_at} />

        {(order.tracking_number || order.courier) && (
          <div style={{ background: INK, padding: '24px 26px', marginBottom: 30 }}>
            <div style={{ ...kicker, color: '#8A8A85' }}>Consignment</div>
            <div style={{ display: 'flex', gap: 48, marginTop: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#8A8A85' }}>
                  Courier
                </div>
                <div className="serif" style={{ fontSize: 24, color: '#FFFFFF', marginTop: 8 }}>
                  {order.courier || 'In transit'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#8A8A85' }}>
                  Tracking number
                </div>
                <div style={{ fontSize: 15, letterSpacing: '0.06em', color: '#FFFFFF', marginTop: 12 }}>
                  {order.tracking_number || '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        {order.status_note && (
          <div
            className="serif"
            style={{ fontStyle: 'italic', fontSize: 18, color: '#4A4A47', margin: '0 0 30px' }}
          >
            {order.status_note}
          </div>
        )}

        <div style={{ ...kicker, fontSize: 10, color: FAINT, marginBottom: 8 }}>Order no.</div>
        <div className="serif" style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 26 }}>
          {orderNo}
        </div>

        {items.map((b, i) => (
          <div
            key={i}
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
              {(b.image_public_id || b.photo_id) && (
                <img
                  src={productImg(b, 120)}
                  alt={b.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: 13 }}>
                {b.slug ? (
                  <Link href={`/product/${b.slug}`} className="underline-link">
                    {b.name}
                  </Link>
                ) : (
                  b.name
                )}
                {b.qty > 1 ? ` × ${b.qty}` : ''}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
                {b.object_no}
                {b.city ? ` · ${b.city}, ${b.country}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 13 }}>{inr(b.price * b.qty)}</div>
          </div>
        ))}

        <div style={{ paddingTop: 22, fontSize: 13, color: MUTED }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>Subtotal</span>
            <span>{inr(order.subtotal)}</span>
          </div>
          {!!order.gift_fee && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Gift packaging</span>
              <span>{inr(order.gift_fee)}</span>
            </div>
          )}
          {!!order.cod_fee && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>COD handling</span>
              <span>{inr(order.cod_fee)}</span>
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 14,
            paddingTop: 16,
            borderTop: `1px solid ${LINE}`,
            fontSize: 16,
          }}
        >
          <span>Total {order.payment_method ? `· ${order.payment_method}` : ''}</span>
          <span>{inr(order.total)}</span>
        </div>

        {order.address && (
          <div style={{ marginTop: 30, paddingTop: 22, borderTop: `1px solid ${LINE}` }}>
            <div style={{ ...kicker, color: FAINT, marginBottom: 10 }}>Deliver to</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#4A4A47' }}>
              {order.full_name}
              <br />
              {[order.address, order.city, order.state, order.pin].filter(Boolean).join(', ')}
              {order.mobile ? (
                <>
                  <br />
                  {order.mobile}
                </>
              ) : null}
            </div>
          </div>
        )}

        <div
          className="serif"
          style={{
            marginTop: 30,
            paddingTop: 20,
            borderTop: '1px dotted ' + LINE,
            fontStyle: 'italic',
            fontSize: 16,
            color: MUTED,
          }}
        >
          Thank you for giving these objects a new home.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginBottom: 90 }}>
        <Link
          href="/shop"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Continue exploring →
        </Link>
        <Link
          href="/order-lookup"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED }}
        >
          Find another order
        </Link>
      </div>
    </main>
  );
}
