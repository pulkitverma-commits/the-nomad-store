import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { sendMail, shipmentEmail, ORDER_STATUSES } from '@/lib/mail';
import { logMail } from '@/lib/maillog';

// Moves an order along Confirmed → Packed → Shipped → Delivered and writes to
// the customer about it. Admin-authenticated with the caller's Supabase session
// (same pattern as sign-upload): the UPDATE itself is still policed by RLS.
export async function POST(req) {
  try {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: admin } = await sb.rpc('is_admin');
    if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await req.json();
    const status = String(body.status || '').toLowerCase();
    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    }
    if (!body.order_id) return NextResponse.json({ error: 'Missing order' }, { status: 400 });

    const patch = {
      status,
      status_updated_at: new Date().toISOString(),
      courier: body.courier ? String(body.courier).slice(0, 80) : null,
      tracking_number: body.tracking_number ? String(body.tracking_number).slice(0, 80) : null,
      status_note: body.status_note ? String(body.status_note).slice(0, 300) : null,
    };

    const { error: upErr } = await sb.from('orders').update(patch).eq('id', body.order_id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    const { data: order } = await sb
      .from('orders')
      .select('*, order_items(qty, price, products(*))')
      .eq('id', body.order_id)
      .maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Confirmed is the state an order is born in — there is nothing to announce.
    const shouldMail = body.notify !== false && status !== 'confirmed' && !!order.email;
    let mailed = 'skipped';
    if (shouldMail) {
      const items = (order.order_items || [])
        .filter((i) => i.products)
        .map((i) => ({ product: i.products, qty: i.qty, price: i.price }));
      try {
        const mail = await shipmentEmail(order, items, status);
        const res = await sendMail({
          to: order.email,
          toName: order.full_name,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          tags: ['nomad', `order-${status}`],
          metadata: { order_id: String(order.id) },
          kind: `order_${status}`,
          // Progress on something already paid for: transactional.
          transactional: true,
        });
        mailed = res?.skipped ? 'skipped' : 'sent';
      } catch (e) {
        console.error('[order-status] mail failed:', e.message);
        if (!e.logged) await logMail(order.email, `order_${status}`, '', 'failed', e.message);
        mailed = 'failed';
      }
    }

    return NextResponse.json({ ok: true, status, mailed });
  } catch (e) {
    return NextResponse.json({ error: 'Could not update the order.' }, { status: 500 });
  }
}
