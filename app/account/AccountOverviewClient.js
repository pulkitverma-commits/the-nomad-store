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
  kicker,
  loadOrders,
  withDeadline,
  itemsOf,
  countItems,
  orderNo,
  fmtDate,
  statusLabel,
} from './orders/shared';

// The landing page behind the sign-in. AccountShell has already decided that
// somebody is here and drawn the nav, so this starts at the greeting.

const ONWARD = [
  ['/account/orders', 'Every order', 'What you have bought, when it went out, where it is now.'],
  ['/account/collection', 'Your collection', 'The objects you own, and the places they came from.'],
  ['/account/saved', 'Saved objects', 'The ones you are still thinking about.'],
  ['/account/addresses', 'Addresses', 'Where we send things, so checkout stops asking.'],
  ['/account/emails', 'Letters', 'How often we write, and whether we write at all.'],
];

function Figure({ n, label }) {
  return (
    <div>
      <div className="serif" style={{ fontWeight: 300, fontSize: 46, lineHeight: 1 }}>
        {n}
      </div>
      <div style={{ ...kicker, fontSize: 10, marginTop: 12 }}>{label}</div>
    </div>
  );
}

export default function AccountOverviewClient() {
  const sb = supabaseBrowser();
  const { session, email, userId } = useCustomerSession();

  const [state, setState] = useState({ ready: false, orders: [], detail: true, failed: false });
  const [name, setName] = useState('');

  useEffect(() => {
    if (!session) return;
    let alive = true;

    loadOrders(sb, { limit: 200 }).then((r) => {
      if (alive) setState({ ready: true, ...r });
    });

    // The profile table arrives with the accounts migration. Until it does,
    // this simply answers nothing and the greeting falls back to the address
    // the person signed in with.
    if (userId) {
      withDeadline(sb.from('profiles').select('full_name').eq('id', userId).maybeSingle()).then(
        ({ data }) => {
          if (alive && data?.full_name) setName(String(data.full_name).trim());
        }
      );
    }

    return () => {
      alive = false;
    };
  }, [sb, session, userId]);

  if (!session) return null;

  const { ready, orders, detail, failed } = state;
  const first = name ? name.split(' ')[0] : '';

  const allItems = orders.flatMap((o) => itemsOf(o));
  const objects = allItems.reduce((t, i) => t + i.qty, 0);
  const countries = new Set(allItems.map((i) => i.country).filter(Boolean)).size;
  const recent = orders.slice(0, 3);

  return (
    <>
      <div style={{ ...kicker, marginBottom: 22 }}>Your account</div>
      <h1
        className="serif"
        style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 20px' }}
      >
        {first ? `Welcome back, ${first}.` : 'Welcome back.'}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 54px', maxWidth: '54ch' }}>
        You are signed in as <span style={{ color: INK }}>{email}</span>. Everything you have bought from us sits under
        that address — including anything you ordered before there was an account to put it in.
      </p>

      {!ready && (
        <div style={{ fontSize: 13, color: FAINT, marginBottom: 60 }}>Reading your orders…</div>
      )}

      {ready && failed && (
        <div
          style={{
            border: `1px solid ${LINE}`,
            background: '#FFFFFF',
            padding: 34,
            marginBottom: 60,
          }}
        >
          <div className="serif" style={{ fontSize: 26, fontWeight: 300, marginBottom: 12 }}>
            We could not open your orders just now.
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: MUTED, margin: '0 0 20px', maxWidth: '52ch' }}>
            Nothing is wrong with your account — the records simply did not come back. Try again in a
            moment. If it is urgent, an order number and the email you gave us will always find an
            order the long way round.
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
        <div style={{ marginBottom: 70, maxWidth: '54ch' }}>
          <div className="serif" style={{ fontSize: 30, fontWeight: 300, marginBottom: 14 }}>
            Nothing here yet — which is a fine place to begin.
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: '0 0 26px' }}>
            When you order something, it will appear here with its passport: where it was found, who
            made it, and where it has got to. Until then the shelves are worth a wander.
          </p>
          <Link
            href="/shop"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            See the objects →
          </Link>
        </div>
      )}

      {ready && !failed && orders.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 70,
              paddingBottom: 40,
              borderBottom: `1px solid ${LINE}`,
              marginBottom: 54,
            }}
          >
            {detail && <Figure n={objects} label="Objects collected" />}
            {detail && <Figure n={countries} label={countries === 1 ? 'Country' : 'Countries'} />}
            <Figure n={orders.length} label={orders.length === 1 ? 'Order placed' : 'Orders placed'} />
          </div>

          <div style={{ ...kicker, marginBottom: 26 }}>
            {recent.length === 1 ? 'Your order' : 'Most recent'}
          </div>
          <div style={{ marginBottom: 30 }}>
            {recent.map((o) => {
              const n = countItems(o);
              return (
                <Link
                  key={o.id}
                  href={`/account/orders/${o.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 20,
                    alignItems: 'baseline',
                    padding: '20px 0',
                    borderTop: `1px solid ${LINE}`,
                  }}
                >
                  <div>
                    <div className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>
                      {orderNo(o.id)}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 7 }}>
                      {[
                        fmtDate(o.created_at),
                        statusLabel(o.status),
                        n === null ? '' : `${n} ${n === 1 ? 'object' : 'objects'}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14 }}>{inr(o.total)}</div>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: FAINT,
                        marginTop: 8,
                      }}
                    >
                      View →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Link
            href="/account/orders"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            {orders.length > recent.length ? `All ${orders.length} orders →` : 'Order history →'}
          </Link>
        </>
      )}

      <div style={{ marginTop: 90, paddingTop: 40, borderTop: `1px solid ${LINE}` }}>
        <div style={{ ...kicker, marginBottom: 30 }}>Elsewhere in your account</div>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 34 }}
        >
          {ONWARD.map(([href, title, note]) => (
            <Link key={href} href={href}>
              <div className="serif" style={{ fontSize: 22, marginBottom: 8 }}>
                {title}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: MUTED }}>{note}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
