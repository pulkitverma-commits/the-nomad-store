'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession } from '@/lib/customerAuth';
import { inr, productImg } from '@/lib/format';
import {
  INK,
  MUTED,
  FAINT,
  LINE,
  STEPS,
  kicker,
  cardStyle,
  loadOrder,
  itemsOf,
  hasItems,
  orderNo,
  fmtDate,
  fmtDateTime,
  statusLabel,
} from '../shared';

// One order, opened by the person who placed it. There is no token in this URL
// and no public RPC behind it: the query goes through the authenticated client
// and the row comes back only because the RLS policy on `orders` says it may.
//
// This borrows the passport's language rather than the passport component
// itself — OrderPassport renders its own <main> and its own page padding, and
// AccountShell has already provided both.

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
              <div style={{ height: 3, background: done ? INK : LINE, borderRadius: 2 }} />
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
          Last updated {fmtDateTime(updatedAt)}
        </div>
      )}
    </div>
  );
}

function Empty({ title, body, href, label }) {
  return (
    <div style={{ maxWidth: '54ch' }}>
      <div style={{ ...kicker, marginBottom: 22 }}>Order</div>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 52, lineHeight: 1.05, margin: '0 0 20px' }}>
        {title}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 30px' }}>{body}</p>
      <Link
        href={href}
        className="underline-link"
        style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
      >
        {label}
      </Link>
    </div>
  );
}

export default function OrderDetailClient({ orderId }) {
  const sb = supabaseBrowser();
  const { session } = useCustomerSession();
  const [state, setState] = useState({ ready: false, order: null, detail: true, failed: false });

  useEffect(() => {
    if (!session) return;
    let alive = true;
    loadOrder(sb, orderId).then((r) => {
      if (alive) setState({ ready: true, ...r });
    });
    return () => {
      alive = false;
    };
  }, [sb, session, orderId]);

  if (!session) return null;
  const { ready, order, failed } = state;

  if (!ready) return <div style={{ fontSize: 13, color: FAINT }}>Opening the order…</div>;

  if (failed) {
    return (
      <Empty
        title="We could not open that order."
        body="The record did not come back — this is on our side, not yours. Try again in a moment, or find the order with its number and the email you gave us."
        href="/order-lookup"
        label="Look up an order →"
      />
    );
  }

  if (!order) {
    return (
      <Empty
        title="No such order under this address."
        body="Either that order number belongs to somebody else, or it was placed with a different email. Sign in with the address you gave at checkout and it will be here."
        href="/account/orders"
        label="Back to your orders →"
      />
    );
  }

  const items = itemsOf(order);
  const count = items.reduce((t, i) => t + i.qty, 0);
  const linesKnown = hasItems(order);

  return (
    <>
      <Link
        href="/account/orders"
        style={{ ...kicker, fontSize: 10, display: 'inline-block', marginBottom: 22 }}
      >
        ← All orders
      </Link>
      <h1
        className="serif"
        style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 18px' }}
      >
        {orderNo(order.id)}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 44px', maxWidth: '54ch' }}>
        {[
          fmtDate(order.created_at) ? `Placed ${fmtDate(order.created_at)}` : '',
          linesKnown ? `${count} ${count === 1 ? 'object' : 'objects'}` : '',
          statusLabel(order.status),
        ]
          .filter(Boolean)
          .join(' · ')}
        {'. '}
        {order.status === 'delivered'
          ? 'Delivered. The passport card is in the paper, not the box — people throw the paper away.'
          : order.status === 'shipped'
            ? 'Handed to the courier. It will travel a great deal less far than it did to reach us.'
            : 'Being wrapped in unbleached paper, each object with its passport card.'}
      </p>

      <div style={{ ...cardStyle, marginBottom: 30 }}>
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
          <div className="serif" style={{ fontStyle: 'italic', fontSize: 18, color: '#4A4A47', margin: '0 0 30px' }}>
            {order.status_note}
          </div>
        )}

        <div style={{ ...kicker, color: FAINT, marginBottom: 8 }}>Order no.</div>
        <div className="serif" style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 26 }}>
          {orderNo(order.id)}
        </div>

        {!linesKnown && (
          <div style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 8 }}>
            The individual objects on this order did not come back just now. The totals below are
            the ones we hold.
          </div>
        )}

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
                  alt={b.name || ''}
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
                  b.name || 'An object we no longer list'
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
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>Shipping</span>
            <span>{order.ship_fee ? inr(order.ship_fee) : 'Free'}</span>
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

        {order.gift && (
          <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1px dotted ${LINE}` }}>
            <div style={{ ...kicker, color: FAINT, marginBottom: 10 }}>Wrapped as a gift</div>
            {order.gift_message ? (
              <div className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: '#4A4A47' }}>
                “{order.gift_message}”
              </div>
            ) : (
              <div style={{ fontSize: 13, color: MUTED }}>No message — paper, string and nothing else.</div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
        <Link
          href={`/account/orders/${order.id}/receipt`}
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Receipt →
        </Link>
        <Link
          href="/account/orders"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED }}
        >
          All orders
        </Link>
        <Link
          href="/shop"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED }}
        >
          Continue exploring
        </Link>
      </div>
    </>
  );
}
