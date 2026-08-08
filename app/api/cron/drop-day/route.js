import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMail, dropDayEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || '';
const MAIL_RPC_SECRET = process.env.MAIL_RPC_SECRET || '';

// Runs every morning (see vercel.json). It only does anything on a day when a
// drop row is marked "Upcoming", and it will not write about the same drop
// twice: mail_log is the ledger, keyed by drop number.
async function run(req) {
  const auth = req.headers.get('authorization') || '';
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const sb = supabase();
  const { data: drops } = await sb.from('drops').select('*').order('id');
  const drop = (drops || []).find((d) => /upcoming|live|open/i.test(d.status || ''));
  if (!drop) {
    return NextResponse.json({ ok: true, sent: 0, note: 'No drop is marked upcoming today.' });
  }

  const kind = `drop_day:${drop.drop_no}`.slice(0, 40);

  const { data: already, error: countErr } = await sb.rpc('mail_kind_count', {
    p_secret: MAIL_RPC_SECRET,
    p_kind: kind,
  });
  if (countErr || already === null || already < 0) {
    return NextResponse.json({ error: 'Mail secret is not configured.' }, { status: 500 });
  }
  if (already > 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      note: `${drop.drop_no} has already been announced (${already} recorded sends).`,
    });
  }

  const { data: recipients } = await sb.rpc('mail_recipients', {
    p_secret: MAIL_RPC_SECRET,
    p_source: 'drops',
  });
  if (!Array.isArray(recipients)) {
    return NextResponse.json({ error: 'Could not read the drop list.' }, { status: 500 });
  }

  const { data: products } = await sb
    .from('products')
    .select('*')
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(4);

  let sent = 0;
  let suppressed = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      const mail = await dropDayEmail(drop, products || [], r.token);
      const res = await sendMail({
        to: r.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        tags: ['nomad', 'drop-day'],
        metadata: { drop: drop.drop_no },
        kind,
        unsubToken: r.token,
        marketing: true,
      });
      if (res?.suppressed) suppressed += 1;
      else sent += 1;
    } catch (e) {
      failed += 1;
      console.error('[drop-day] failed for', r.email, e.message);
    }
  }

  return NextResponse.json({ ok: true, drop: drop.drop_no, recipients: recipients.length, sent, suppressed, failed });
}

export async function GET(req) {
  return run(req);
}

// Vercel Cron issues GET; POST is here so the send can also be triggered by hand.
export async function POST(req) {
  return run(req);
}
