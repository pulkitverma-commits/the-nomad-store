import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMail, orderEmail } from '@/lib/mail';
import { logMail } from '@/lib/maillog';

export async function POST(req) {
  try {
    const { customer, items } = await req.json();
    if (!customer?.full_name || !/.+@.+\..+/.test(customer?.email || '')) {
      return NextResponse.json({ error: 'Name and a valid email are required.' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your bag is empty.' }, { status: 400 });
    }
    const clean = items
      .map((i) => ({ product_id: Number(i.product_id), qty: Math.max(1, Math.min(20, Number(i.qty) || 1)) }))
      .filter((i) => Number.isInteger(i.product_id));

    const payload = {
      full_name: String(customer.full_name).slice(0, 200),
      mobile: String(customer.mobile || '').slice(0, 20),
      address: String(customer.address || '').slice(0, 500),
      city: String(customer.city || '').slice(0, 100),
      state: String(customer.state || '').slice(0, 100),
      pin: String(customer.pin || '').slice(0, 10),
      email: String(customer.email).slice(0, 200),
      payment_method: String(customer.payment_method || 'UPI').slice(0, 50),
      gift: !!customer.gift,
      gift_message: String(customer.gift_message || '').slice(0, 500),
    };

    const sb = supabase();
    // place_order_with_token wraps place_order (same behaviour, same stock
    // locking) and additionally returns the order's lookup_token, which the
    // confirmation email needs for its "track this order" link.
    const { data, error } = await sb.rpc('place_order_with_token', {
      p_customer: payload,
      p_items: clean,
    });
    if (error) {
      const msg = /only (\d+) left/.test(error.message)
        ? 'One of the objects in your bag just sold out at that quantity. Please adjust your bag.'
        : 'Could not place the order. Please try again.';
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    // Confirmation email — never let a mail failure fail a paid-for order.
    try {
      const { data: products } = await sb
        .from('products')
        .select('*')
        .in('id', clean.map((i) => i.product_id));
      const byId = Object.fromEntries((products || []).map((p) => [p.id, p]));
      const lines = clean
        .map((i) => ({ product: byId[i.product_id], qty: i.qty, price: byId[i.product_id]?.price || 0 }))
        .filter((l) => l.product);

      const order = {
        id: data.order_id,
        lookup_token: data.lookup_token,
        ...payload,
        subtotal: lines.reduce((t, l) => t + l.price * l.qty, 0),
        gift_fee: payload.gift ? 250 : 0,
        cod_fee: payload.payment_method === 'Cash on delivery' ? 50 : 0,
        ship_fee: lines.reduce((t, l) => t + l.price * l.qty, 0) >= 2500 ? 0 : 150,
        total: data.total,
      };

      const mail = await orderEmail(order, lines);
      await sendMail({
        to: payload.email,
        toName: payload.full_name,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        tags: ['nomad', 'order-confirmation'],
        metadata: { order_id: String(data.order_id) },
        kind: 'order',
        // A receipt for something already paid for — it is not marketing and
        // must not be withheld from someone who left the newsletter.
        transactional: true,
      });
    } catch (e) {
      console.error('[checkout] confirmation mail failed:', e.message);
      if (!e.logged) await logMail(payload.email, 'order', '', 'failed', e.message);
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Could not place the order.' }, { status: 500 });
  }
}
