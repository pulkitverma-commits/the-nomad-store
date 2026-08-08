'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUi } from '@/components/Ui';
import { inr, productImg } from '@/lib/format';
import { useCustomerSession } from '@/lib/customerAuth';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const PAY_METHODS = [
  ['UPI', 'GPay · PhonePe · Paytm'],
  ['Credit or debit card', ''],
  ['Net banking', ''],
  ['Wallets', ''],
  ['Cash on delivery', '₹50 handling'],
];

const sectionLabel = {
  fontSize: 10,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
  paddingBottom: 14,
  borderBottom: '1px solid #111111',
  marginBottom: 26,
};

function Field({ placeholder, value, onChange, span }) {
  return (
    <div style={{ gridColumn: span ? 'span 2' : undefined, borderBottom: '1px solid #E8E8E5', paddingBottom: 11 }}>
      <input placeholder={placeholder} value={value} onChange={onChange} className="input-line" />
    </div>
  );
}

export default function CheckoutClient() {
  const { bag, clearBag } = useUi();
  const router = useRouter();
  const { session, loading: authLoading, email: accountEmail } = useCustomerSession();
  const [form, setForm] = useState({
    full_name: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    email: '',
  });
  const [pay, setPay] = useState('UPI');
  const [gift, setGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  // Signing in is the price of admission now, so it should at least save the
  // customer some typing: the account email, and the default address if there
  // is one. Never overwrite something already typed into the form.
  useEffect(() => {
    if (!session) return;
    let alive = true;
    setForm((f) => (f.email ? f : { ...f, email: accountEmail }));
    supabaseBrowser()
      .from('addresses')
      .select('*')
      .eq('is_default', true)
      .limit(1)
      .then(({ data }) => {
        const a = data && data[0];
        if (!alive || !a) return;
        setForm((f) => ({
          ...f,
          full_name: f.full_name || a.full_name || '',
          mobile: f.mobile || a.mobile || '',
          address: f.address || a.address || '',
          city: f.city || a.city || '',
          state: f.state || a.state || '',
          pin: f.pin || a.pin || '',
        }));
      });
    return () => {
      alive = false;
    };
  }, [session, accountEmail]);

  const subtotal = bag.reduce((t, b) => t + b.price * b.qty, 0);
  const giftFee = gift ? 250 : 0;
  const codFee = pay === 'Cash on delivery' ? 50 : 0;
  // Matches the published Shipping policy: free over Rs 2,500, Rs 150 below it.
  const shipFee = subtotal >= 2500 || subtotal === 0 ? 0 : 150;
  const total = subtotal + giftFee + codFee + shipFee;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const placeOrder = async () => {
    if (bag.length === 0) return;
    if (!form.full_name.trim()) return setError('Please tell us your name.');
    if (!/.+@.+\..+/.test(form.email)) return setError('Please enter a valid email for order updates.');
    setError('');
    setStatus('placing');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { ...form, payment_method: pay, gift, gift_message: giftMessage },
          items: bag.map((b) => ({ product_id: b.id, qty: b.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      try {
        window.sessionStorage.setItem(
          'nomad-last-order',
          JSON.stringify({
            id: data.order_id,
            total: data.total,
            name: form.full_name,
            email: form.email,
            payment_method: pay,
            gift,
            items: bag,
          })
        );
      } catch (e) {}
      // The order was created by the API with the anon key, so it has no
      // user_id. Attach it to this account before we navigate away. Failure is
      // survivable — the RLS policy also matches on the verified email.
      try {
        await supabaseBrowser().rpc('claim_my_orders');
      } catch (e) {}
      clearBag();
      router.push(
        data.lookup_token
          ? `/order/${data.order_id}?t=${data.lookup_token}`
          : `/order/${data.order_id}`
      );
    } catch (e) {
      setStatus('idle');
      setError(e.message);
    }
  };

  // Until we know, render nothing rather than flashing the sign-in wall at
  // somebody who is already signed in.
  if (authLoading) return null;

  // Checkout is behind the account now. The bag stays exactly where it is —
  // it lives in this browser, so it survives the trip out to email and back.
  if (!session) {
    return (
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '70px 40px 0' }}>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, margin: '0 0 48px' }}>Checkout</h1>
        <div className="split" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <div style={{ ...sectionLabel }}>One step first</div>
            <div className="serif" style={{ fontWeight: 300, fontSize: 40, lineHeight: 1.1, margin: '0 0 20px' }}>
              Sign in to finish
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', maxWidth: '52ch', margin: '0 0 14px' }}>
              Every object here is one of a kind, so an order is a record worth keeping. Signing in
              means this one lands in your account with its passport, its tracking and its receipt —
              and that the next time you buy, we already know where to send it.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: '#B4B0A6', maxWidth: '52ch', margin: '0 0 34px' }}>
              Your bag is kept in this browser. Nothing in it is lost while you fetch the link.
            </p>
            <Link
              href="/signin?next=%2Fcheckout"
              className="btn-dark"
              style={{
                display: 'inline-block',
                padding: '16px 34px',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              Sign in to check out →
            </Link>
            <div style={{ marginTop: 34, paddingTop: 22, borderTop: '1px solid #E8E8E5', maxWidth: '52ch' }}>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: '#B4B0A6', margin: 0 }}>
                Bought from us before as a guest? Sign in with the same address and those orders
                come with you.
              </p>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E5', padding: 32 }}>
            <div style={{ ...sectionLabel }}>In your bag</div>
            {bag.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '10px 0',
                  fontSize: 13,
                  borderBottom: '1px solid #F2F1ED',
                }}
              >
                <span>
                  {b.name}
                  {b.qty > 1 ? ` × ${b.qty}` : ''}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>{inr(b.price * b.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 18, fontSize: 15 }}>
              <span>Subtotal</span>
              <span>{inr(subtotal)}</span>
            </div>
          </div>
        </div>
        <div style={{ height: 120 }} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1240, margin: '0 auto', padding: '70px 40px 0' }}>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, margin: '0 0 48px' }}>Checkout</h1>
      {bag.length === 0 ? (
        <div style={{ padding: '40px 0 80px' }}>
          <div className="serif" style={{ fontSize: 30, marginBottom: 16 }}>Your bag is empty</div>
          <Link href="/shop" className="underline-link" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Start exploring →
          </Link>
        </div>
      ) : (
        <div className="split" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <div style={{ ...sectionLabel }}>Deliver to</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 44 }}>
              <Field placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
              <Field placeholder="Mobile number" value={form.mobile} onChange={set('mobile')} />
              <Field placeholder="Flat, building, street" value={form.address} onChange={set('address')} span />
              <Field placeholder="City" value={form.city} onChange={set('city')} />
              <Field placeholder="State" value={form.state} onChange={set('state')} />
              <Field placeholder="PIN code" value={form.pin} onChange={set('pin')} />
              <Field placeholder="Email for order updates" value={form.email} onChange={set('email')} />
            </div>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Payment</div>
            {PAY_METHODS.map(([m, note]) => (
              <div
                key={m}
                onClick={() => setPay(m)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 0',
                  borderBottom: '1px solid #F2F1ED',
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    border: '1px solid #111111',
                    background: pay === m ? '#111111' : 'transparent',
                    flex: 'none',
                  }}
                />
                <span style={{ fontSize: 14 }}>{m}</span>
                <span style={{ fontSize: 11, color: '#B4B0A6', marginLeft: 'auto' }}>{note}</span>
              </div>
            ))}
            <div style={{ marginTop: 44 }}>
              <div style={{ ...sectionLabel, marginBottom: 22 }}>Gifting</div>
              <div
                onClick={() => setGift(!gift)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 18 }}
              >
                <span
                  style={{
                    width: 34,
                    height: 18,
                    borderRadius: 9,
                    background: gift ? '#111111' : '#DEDBD3',
                    position: 'relative',
                    flex: 'none',
                    transition: 'background .25s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: gift ? 18 : 2,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      transition: 'left .25s',
                    }}
                  />
                </span>
                <span style={{ fontSize: 14 }}>Gift packaging — unbleached wrap and wax seal</span>
                <span style={{ fontSize: 13, color: '#6B6B68', marginLeft: 'auto' }}>₹250</span>
              </div>
              <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 11 }}>
                <input
                  placeholder="Gift message (optional)"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="input-line"
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 40,
                padding: '18px 22px',
                background: '#FCF7E8',
                border: '1px solid #F2E38F',
                fontSize: 12,
                lineHeight: 1.7,
                color: '#6B6B68',
              }}
            >
              This is a demonstration store — no payment is collected. Your order is recorded and
              stock is reserved, but no money moves.
            </div>
          </div>
          <aside style={{ background: '#F7F7F5', padding: 40, position: 'sticky', top: 104 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', paddingBottom: 16, borderBottom: '1px solid #E8E8E5', marginBottom: 8 }}>
              Your bag
            </div>
            {bag.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr auto',
                  gap: 16,
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #E8E8E5',
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
                  <div style={{ fontSize: 11, color: '#6B6B68', marginTop: 4 }}>{b.origin}</div>
                </div>
                <div style={{ fontSize: 13 }}>{inr(b.price * b.qty)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 0 10px', fontSize: 13, color: '#6B6B68' }}>
              <span>Subtotal</span>
              <span>{inr(subtotal)}</span>
            </div>
            {gift && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, fontSize: 13, color: '#6B6B68' }}>
                <span>Gift packaging</span>
                <span>{inr(giftFee)}</span>
              </div>
            )}
            {codFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, fontSize: 13, color: '#6B6B68' }}>
                <span>COD handling</span>
                <span>{inr(codFee)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: 18,
                fontSize: 13,
                color: '#6B6B68',
                borderBottom: '1px solid #E8E8E5',
              }}
            >
              <span>Shipping</span>
              <span>{shipFee === 0 ? 'Free' : inr(shipFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0 26px', fontSize: 17 }}>
              <span>Total</span>
              <span>{inr(total)}</span>
            </div>
            {error && (
              <div style={{ fontSize: 12, color: '#B3402A', marginBottom: 14 }}>{error}</div>
            )}
            <div
              className="btn-dark"
              onClick={status === 'placing' ? undefined : placeOrder}
              style={{
                textAlign: 'center',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: 19,
                opacity: status === 'placing' ? 0.6 : 1,
              }}
            >
              {status === 'placing' ? 'Placing order…' : `Pay ${inr(total)}`}
            </div>
            <div className="serif" style={{ fontStyle: 'italic', fontSize: 16, color: '#6B6B68', marginTop: 22, textAlign: 'center' }}>
              Each object travels with its passport card.
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
