import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMail, welcomeEmail, dropEmail } from '@/lib/mail';
import { logMail } from '@/lib/maillog';

export async function POST(req) {
  try {
    const { email, source } = await req.json();
    if (!/.+@.+\..+/.test(email || '')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const clean = String(email).slice(0, 200);
    const src = String(source || 'newsletter').slice(0, 50);

    const { error } = await supabase().from('subscribers').insert({ email: clean, source: src });
    const alreadySubscribed = error && error.code === '23505';
    if (error && !alreadySubscribed) {
      return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
    }

    // Only greet first-time signups; never let a mail failure break the signup.
    if (!alreadySubscribed) {
      try {
        const mail = src === 'drops' ? await dropEmail(clean) : await welcomeEmail(clean);
        await sendMail({
          to: clean,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          tags: ['nomad', src === 'drops' ? 'drop-list' : 'newsletter-welcome'],
          metadata: { source: src },
        });
        await logMail(clean, src === 'drops' ? 'drop_list' : 'welcome', mail.subject, 'sent');
      } catch (e) {
        console.error('[subscribe] mail failed:', e.message);
        await logMail(clean, src === 'drops' ? 'drop_list' : 'welcome', '', 'failed', e.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
  }
}
