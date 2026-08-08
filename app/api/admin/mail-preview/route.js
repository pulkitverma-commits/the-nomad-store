import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import {
  welcomeEmail,
  dropEmail,
  notifyEmail,
  orderEmail,
  shipmentEmail,
  landedEmail,
  dropDayEmail,
} from '@/lib/mail';

// Renders any transactional email with live data so admins can preview it.
// Gated on an admin session (app_config is RLS-locked to admin_users).
export async function GET(req) {
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') || 'welcome';
  const token = url.searchParams.get('token') || '';

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: rows } = await sb.from('app_config').select('key').limit(1);
  if (!rows || rows.length === 0) {
    return new Response('Not authorized', { status: 403 });
  }

  try {
    let mail;
    if (kind === 'drops') mail = await dropEmail('preview@thenomad.store');
    else if (kind === 'notify') {
      const { data } = await sb.from('coming_soon').select('name').limit(1).maybeSingle();
      mail = await notifyEmail('preview@thenomad.store', data?.name || 'Kanazawa Wooden Tea Tray');
    } else if (kind === 'order') {
      const { data: products } = await sb.from('products').select('*').limit(2);
      const lines = (products || []).map((p, i) => ({ product: p, qty: i + 1, price: p.price }));
      const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0);
      mail = await orderEmail(
        {
          id: 'preview-0000-0000',
          full_name: 'Pulkit Verma',
          email: 'preview@thenomad.store',
          mobile: '+91 90000 00000',
          address: '12 Hauz Khas Village',
          city: 'New Delhi',
          state: 'Delhi',
          pin: '110016',
          payment_method: 'UPI',
          gift: true,
          subtotal,
          gift_fee: 250,
          cod_fee: 0,
          total: subtotal + 250,
        },
        lines
      );
    } else if (kind === 'shipped' || kind === 'packed' || kind === 'delivered') {
      const { data: products } = await sb.from('products').select('*').limit(2);
      const lines = (products || []).map((p, i) => ({ product: p, qty: i + 1, price: p.price }));
      mail = await shipmentEmail(
        {
          id: '00000000-0000-0000-0000-000000000000',
          lookup_token: 'preview-token',
          full_name: 'Pulkit Verma',
          email: 'preview@thenomad.store',
          address: '12 Hauz Khas Village',
          city: 'New Delhi',
          state: 'Delhi',
          pin: '110016',
          mobile: '+91 90000 00000',
          courier: 'Blue Dart',
          tracking_number: 'BD8837194402',
          status_note: null,
        },
        lines,
        kind
      );
    } else if (kind === 'landed') {
      const { data: item } = await sb.from('coming_soon').select('*').limit(1).maybeSingle();
      const { data: product } = await sb.from('products').select('*').limit(1).maybeSingle();
      mail = await landedEmail(item || { name: product?.name, obj_no: product?.object_no }, product, null);
    } else if (kind === 'dropday') {
      const { data: drop } = await sb.from('drops').select('*').limit(1).maybeSingle();
      const { data: products } = await sb.from('products').select('*').gt('stock', 0).limit(4);
      mail = await dropDayEmail(drop || { drop_no: 'Drop 006', city: 'Tokyo', note: '28 objects' }, products || [], null);
    } else mail = await welcomeEmail('preview@thenomad.store');

    return new Response(
      `<!--  SUBJECT: ${mail.subject}  -->\n${mail.html}`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (e) {
    return new Response('Preview failed: ' + e.message, { status: 500 });
  }
}
