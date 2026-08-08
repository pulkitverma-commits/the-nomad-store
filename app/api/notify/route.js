import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMail, notifyEmail } from '@/lib/mail';
import { logMail } from '@/lib/maillog';

export async function POST(req) {
  try {
    const { email, item_name } = await req.json();
    if (!/.+@.+\..+/.test(email || '') || !item_name) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const clean = String(email).slice(0, 200);
    const item = String(item_name).slice(0, 200);

    const { error } = await supabase()
      .from('notify_requests')
      .insert({ email: clean, item_name: item });
    const already = error && error.code === '23505';
    if (error && !already) {
      return NextResponse.json({ error: 'Could not save' }, { status: 500 });
    }

    if (!already) {
      try {
        const mail = await notifyEmail(clean, item);
        await sendMail({
          to: clean,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          tags: ['nomad', 'notify-me'],
          metadata: { item },
        });
        await logMail(clean, 'notify', mail.subject, 'sent');
      } catch (e) {
        console.error('[notify] mail failed:', e.message);
        await logMail(clean, 'notify', '', 'failed', e.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
}
