'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession } from '@/lib/customerAuth';
import { inr } from '@/lib/format';
import {
  MUTED,
  FAINT,
  LINE,
  kicker,
  loadOrders,
  countItems,
  orderNo,
  fmtDate,
  statusLabel,
} from './shared';

// Every order the signed-in address has ever placed, newest first. Guest
// orders from before the account existed are in here too — the policy on
// `orders` matches on the verified email as well as on user_id.

const colHead = {
  fontSize: 9,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: FAINT,
};

export default function OrdersClient() {
  const sb = supabaseBrowser();
  const { session } = useCustomerSession();
  const [state, setState] = useState({ ready: false, orders: [], detail: true, failed: false });

  useEffect(() => {
    if (!session) return;
    let alive = true;
    loadOrders(sb).then((r) => {
      if (alive) setState({ ready: true, ...r });
    });
    return () => {
      alive = false;
    };
  }, [sb, session]);

  if (!session) return null;
  const { ready, orders, failed } = state;

  return (
    <>
      <div style={{ ...kicker, marginBottom: 22 }}>Your orders</div>
      <h1
        className="serif"
        style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 20px' }}
      >
        Everything you have sent for.
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 54px', maxWidth: '54ch' }}>
        Newest first. Open any one for its passport — where each object came from, where it has got
        to, and a receipt you can keep.
      </p>

      {!ready && <div style={{ fontSize: 13, color: FAINT }}>Reading your orders…</div>}

      {ready && failed && (
        <div style={{ border: `1px solid ${LINE}`, background: '#FFFFFF', padding: 34, maxWidth: '58ch' }}>
          <div className="serif" style={{ fontSize: 26, fontWeight: 300, marginBottom: 12 }}>
            We could not open your orders just now.
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: MUTED, margin: '0 0 20px' }}>
            The records did not come back. This is on our side. Try again in a moment — or find a
            single order the long way round, with its number and the email you gave us.
          </p>
          <Link
            href="/order-lookup"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            Look up an order →
          </Link>
        </div>
      )}

      {ready && !failed && orders.length === 0 && (
        <div style={{ maxWidth: '54ch' }}>
          <div className="serif" style={{ fontSize: 30, fontWeight: 300, marginBottom: 14 }}>
            No orders under this address.
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 26px' }}>
            If you have bought from us before with a different email, sign in with that one instead
            and the orders will be waiting. Otherwise, there is a great deal to see.
          </p>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            <Link
              href="/shop"
              className="underline-link"
              style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
            >
              See the objects →
            </Link>
            <Link
              href="/order-lookup"
              className="underline-link"
              style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED }}
            >
              Find an order by number
            </Link>
          </div>
        </div>
      )}

      {ready && !failed && orders.length > 0 && (
        <>
          {/* Five columns is right at desk width and wrong on a phone, so
              below 760px the middle three collapse into one quiet line. */}
          <style>
            {'.ord-meta{display:none}' +
              '@media (max-width:760px){' +
              '.ord-head{display:none!important}' +
              '.ord-row{grid-template-columns:1fr auto!important}' +
              '.ord-desk{display:none!important}' +
              '.ord-meta{display:block;grid-column:1/-1;margin-top:7px}}'}
          </style>

          <div
            className="ord-head"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1.2fr 1fr 0.9fr 0.8fr',
              gap: 20,
              paddingBottom: 12,
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            <div style={colHead}>Order</div>
            <div style={colHead}>Placed</div>
            <div style={colHead}>Status</div>
            <div style={colHead}>Objects</div>
            <div style={{ ...colHead, textAlign: 'right' }}>Total</div>
          </div>

          {orders.map((o) => {
            const n = countItems(o);
            return (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="ord-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.2fr 1fr 0.9fr 0.8fr',
                  gap: 20,
                  alignItems: 'baseline',
                  padding: '22px 0',
                  borderBottom: `1px solid ${LINE}`,
                }}
              >
                <div className="serif" style={{ fontSize: 22, lineHeight: 1.2 }}>
                  {orderNo(o.id)}
                </div>
                <div className="ord-desk" style={{ fontSize: 13, color: MUTED }}>
                  {fmtDate(o.created_at) || '—'}
                </div>
                <div className="ord-desk" style={{ fontSize: 13 }}>
                  {statusLabel(o.status)}
                </div>
                <div className="ord-desk" style={{ fontSize: 13, color: MUTED }}>
                  {n === null ? '—' : n}
                </div>
                <div style={{ fontSize: 13, textAlign: 'right' }}>{inr(o.total)}</div>
                <div className="ord-meta" style={{ fontSize: 12, color: MUTED }}>
                  {[
                    fmtDate(o.created_at),
                    statusLabel(o.status),
                    n === null ? '' : `${n} ${n === 1 ? 'object' : 'objects'}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </Link>
            );
          })}

          <div style={{ marginTop: 40, fontSize: 12, color: FAINT }}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} under this address.
          </div>
        </>
      )}
    </>
  );
}
