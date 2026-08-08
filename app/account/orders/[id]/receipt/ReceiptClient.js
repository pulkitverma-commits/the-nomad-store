'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession } from '@/lib/customerAuth';
import { inr } from '@/lib/format';
import {
  INK,
  MUTED,
  FAINT,
  LINE,
  CREAM,
  kicker,
  loadOrder,
  itemsOf,
  hasItems,
  orderNo,
  fmtDate,
} from '../../shared';

// A receipt, and only a receipt. The Nomad holds no GSTIN and takes no money
// at checkout, so nothing here may call itself a tax invoice — see the note at
// the foot of the sheet, which is the legally load-bearing part of this page.
//
// Print rules live inline. The site header and footer are plain <header> and
// <footer> elements and the account nav is a <nav>, so element selectors reach
// all three without touching files this page does not own.
const PRINT_CSS = `
@media print {
  header, footer, nav, [data-noprint] { display: none !important; }
  html, body { background: #FFFFFF !important; }
  main { max-width: none !important; margin: 0 !important; padding: 0 !important; }
  .receipt-backdrop { background: #FFFFFF !important; padding: 0 !important; }
  .receipt-sheet { border: none !important; padding: 0 !important; background: #FFFFFF !important; box-shadow: none !important; }
  a { color: #111111 !important; border-bottom: none !important; }
  .receipt-sheet { break-inside: auto; }
  .receipt-line { break-inside: avoid; }
  @page { margin: 16mm; }
}
`;

const label = {
  fontSize: 9,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: FAINT,
  marginBottom: 9,
};

function Row({ children, strong }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 20,
        padding: strong ? '16px 0 0' : '5px 0',
        marginTop: strong ? 14 : 0,
        borderTop: strong ? `1px solid ${LINE}` : 'none',
        fontSize: strong ? 16 : 13,
        color: strong ? INK : MUTED,
      }}
    >
      {children}
    </div>
  );
}

export default function ReceiptClient({ orderId }) {
  const sb = supabaseBrowser();
  const { session, email } = useCustomerSession();
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

  if (!ready) return <div style={{ fontSize: 13, color: FAINT }}>Setting the receipt…</div>;

  if (failed || !order) {
    return (
      <div style={{ maxWidth: '54ch' }}>
        <div style={{ ...kicker, marginBottom: 22 }}>Receipt</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 52, lineHeight: 1.05, margin: '0 0 20px' }}>
          {failed ? 'We could not draw up the receipt.' : 'No such order under this address.'}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 30px' }}>
          {failed
            ? 'The order did not come back — this is on our side. Try again in a moment.'
            : 'Either that order belongs to somebody else, or it was placed with a different email address.'}
        </p>
        <Link
          href="/account/orders"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Back to your orders →
        </Link>
      </div>
    );
  }

  const items = itemsOf(order);
  const linesKnown = hasItems(order);
  const no = orderNo(order.id);
  const addr = [order.address, order.city, order.state, order.pin].filter(Boolean).join(', ');

  return (
    <>
      <style>{PRINT_CSS}</style>

      <div data-noprint style={{ marginBottom: 30 }}>
        <Link href={`/account/orders/${order.id}`} style={{ ...kicker, fontSize: 10 }}>
          ← Back to the order
        </Link>
      </div>

      <div
        className="receipt-backdrop"
        style={{ background: CREAM, padding: 40, marginBottom: 30 }}
      >
        <div
          className="receipt-sheet"
          style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, padding: 46, maxWidth: 720, margin: '0 auto' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 20,
              borderBottom: `1px solid ${INK}`,
              paddingBottom: 16,
              marginBottom: 34,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 14, letterSpacing: '0.42em', textTransform: 'uppercase', fontWeight: 600 }}>
              The Nomad
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: MUTED }}>
              Receipt
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
              gap: 30,
              marginBottom: 40,
            }}
          >
            <div>
              <div style={label}>Receipt no.</div>
              <div className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>
                {no}
              </div>
            </div>
            <div>
              <div style={label}>Order placed</div>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>{fmtDate(order.created_at) || '—'}</div>
            </div>
            <div>
              <div style={label}>Payment method</div>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>{order.payment_method || '—'}</div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
              gap: 34,
              paddingBottom: 34,
              marginBottom: 34,
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            <div>
              <div style={label}>Billed to</div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#4A4A47' }}>
                {order.full_name}
                {addr ? (
                  <>
                    <br />
                    {addr}
                  </>
                ) : null}
                {order.mobile ? (
                  <>
                    <br />
                    {order.mobile}
                  </>
                ) : null}
                {order.email || email ? (
                  <>
                    <br />
                    {order.email || email}
                  </>
                ) : null}
              </div>
            </div>
            <div>
              <div style={label}>Shipped to</div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#4A4A47' }}>
                {order.full_name}
                {addr ? (
                  <>
                    <br />
                    {addr}
                  </>
                ) : null}
                <br />
                <span style={{ color: FAINT }}>Same as billing.</span>
              </div>
            </div>
          </div>

          <div style={{ ...label, marginBottom: 16 }}>Objects</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 46px 92px 100px',
              gap: 12,
              paddingBottom: 10,
              borderBottom: `1px solid ${LINE}`,
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: FAINT,
            }}
          >
            <div>Description</div>
            <div style={{ textAlign: 'right' }}>Qty</div>
            <div style={{ textAlign: 'right' }}>Unit</div>
            <div style={{ textAlign: 'right' }}>Amount</div>
          </div>

          {linesKnown ? (
            items.map((b, i) => (
              <div
                key={i}
                className="receipt-line"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 46px 92px 100px',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: '1px solid #F2F1ED',
                  fontSize: 13,
                  alignItems: 'baseline',
                }}
              >
                <div>
                  {b.name || 'An object we no longer list'}
                  {b.object_no || b.city ? (
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
                      {b.object_no}
                      {b.city ? ` · ${b.city}, ${b.country}` : ''}
                    </div>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right' }}>{b.qty}</div>
                <div style={{ textAlign: 'right' }}>{inr(b.price)}</div>
                <div style={{ textAlign: 'right' }}>{inr(b.price * b.qty)}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, padding: '16px 0' }}>
              The individual objects on this order could not be read just now. The totals below are
              the ones we hold against it.
            </div>
          )}

          <div style={{ marginTop: 26 }}>
            <Row>
              <span>Subtotal</span>
              <span>{inr(order.subtotal)}</span>
            </Row>
            <Row>
              <span>Shipping</span>
              <span>{order.ship_fee ? inr(order.ship_fee) : 'Free'}</span>
            </Row>
            <Row>
              <span>Gift wrap</span>
              <span>{order.gift_fee ? inr(order.gift_fee) : '—'}</span>
            </Row>
            <Row>
              <span>Cash on delivery handling</span>
              <span>{order.cod_fee ? inr(order.cod_fee) : '—'}</span>
            </Row>
            <Row strong>
              <span>Total</span>
              <span>{inr(order.total)}</span>
            </Row>
          </div>

          <div
            style={{
              marginTop: 40,
              paddingTop: 22,
              borderTop: `1px dotted ${LINE}`,
              fontSize: 11,
              lineHeight: 1.9,
              color: MUTED,
            }}
          >
            This is a receipt — a record of the order as we hold it. It is not a tax invoice: The
            Nomad is not registered for GST and no tax has been charged or collected. No payment was
            collected against this order.
          </div>

          <div
            className="serif"
            style={{ marginTop: 24, fontStyle: 'italic', fontSize: 16, color: MUTED }}
          >
            Thank you for giving these objects a new home.
          </div>

          <div style={{ marginTop: 26, fontSize: 10, letterSpacing: '0.12em', color: FAINT }}>
            The Nomad · New Delhi · postcards@foxnetglobal.com
          </div>
        </div>
      </div>

      <div data-noprint style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => window.print()}
          className="btn-dark"
          style={{
            border: 'none',
            padding: '15px 26px',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: 'inherit',
          }}
        >
          Print / save as PDF
        </button>
        <Link
          href={`/account/orders/${order.id}`}
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED }}
        >
          Back to the order
        </Link>
      </div>
    </>
  );
}
