import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import OrderPassport from './OrderPassport';
import OrderClient from './OrderClient';

export const metadata = {
  title: 'Order — The Nomad',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// The order is only ever served against its lookup token, which is emailed to
// the buyer. No token, no order data — the page falls back to whatever the
// buyer's own browser remembers from checkout, and points at the lookup page.
export default async function OrderPage({ params, searchParams }) {
  const token = typeof searchParams?.t === 'string' ? searchParams.t : '';
  let order = null;

  if (token && /^[0-9a-f-]{36}$/i.test(params.id)) {
    const { data } = await supabase().rpc('get_order_by_token', {
      p_order_id: params.id,
      p_token: token,
    });
    if (data && !data.error) order = data;
  }

  if (order) return <OrderPassport order={order} showThanks={order.status === 'confirmed'} />;

  if (token) {
    // A token was supplied and it did not match.
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '110px 40px 0' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 22 }}>
          Link not recognised
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 24px' }}>
          That link has gone stale.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', margin: '0 0 36px' }}>
          Either the order number or the key in the link is wrong. The surest way back in is your
          order number and the email you gave us.
        </p>
        <Link
          href="/order-lookup"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Look up an order →
        </Link>
        <div style={{ height: 120 }} />
      </main>
    );
  }

  return <OrderClient orderId={params.id} />;
}
