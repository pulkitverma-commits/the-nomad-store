import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { sendMail, landedEmail, subscriberToken } from '@/lib/mail';
import { logMail } from '@/lib/maillog';

// A Coming Soon object has landed as a real product. Everybody who asked to be
// told gets told, once: notified_at is stamped as each send succeeds, so a
// second run only picks up the people the first run missed.
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

    const { coming_soon_id, product_id } = await req.json();
    if (!coming_soon_id || !product_id) {
      return NextResponse.json({ error: 'Pick the object and the product it became.' }, { status: 400 });
    }

    const { data: item } = await sb.from('coming_soon').select('*').eq('id', coming_soon_id).maybeSingle();
    const { data: product } = await sb.from('products').select('*').eq('id', product_id).maybeSingle();
    if (!item || !product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await sb.from('coming_soon').update({ landed_product_id: product.id }).eq('id', item.id);

    const { data: waiting } = await sb
      .from('notify_requests')
      .select('*')
      .eq('item_name', item.name)
      .is('notified_at', null);

    let sent = 0;
    let suppressed = 0;
    let failed = 0;

    for (const row of waiting || []) {
      try {
        const unsubToken = await subscriberToken(row.email);
        const mail = await landedEmail(item, product, unsubToken);
        const res = await sendMail({
          to: row.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          tags: ['nomad', 'notify-landed'],
          metadata: { item: item.name, product_id: String(product.id) },
          kind: 'landed',
          unsubToken,
        });
        if (res?.suppressed) suppressed += 1;
        else sent += 1;
        // Stamped either way: a suppressed recipient must not be retried on
        // every subsequent run.
        await sb
          .from('notify_requests')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', row.id);
      } catch (e) {
        failed += 1;
        console.error('[notify-landed] failed for', row.email, e.message);
        if (!e.logged) await logMail(row.email, 'landed', '', 'failed', e.message);
      }
    }

    return NextResponse.json({
      ok: true,
      item: item.name,
      product: product.name,
      waiting: (waiting || []).length,
      sent,
      suppressed,
      failed,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Could not send the landing emails.' }, { status: 500 });
  }
}
