import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMail, welcomeEmail, dropEmail, subscriberToken } from '@/lib/mail';
import { logMail } from '@/lib/maillog';

export async function POST(req) {
  try {
    const { email, source } = await req.json();
    if (!/.+@.+\..+/.test(email || '')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const clean = String(email).slice(0, 200);
    const src = String(source || 'newsletter').slice(0, 50);

    // Someone who has opted out stays opted out. We deliberately do not let a
    // form post re-add a suppressed address: without double opt-in that would
    // let anyone put anyone else's address back on the list. The way back in is
    // the token-gated "resubscribe me" link on the unsubscribe page.
    const { data: suppressed } = await supabase().rpc('is_unsubscribed', { p_email: clean });
    if (suppressed) return NextResponse.json({ ok: true, suppressed: true });

    const { error } = await supabase().from('subscribers').insert({ email: clean, source: src });
    const alreadySubscribed = error && error.code === '23505';
    if (error && !alreadySubscribed) {
      return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
    }

    // Only greet first-time signups; never let a mail failure break the signup.
    const kind = src === 'drops' ? 'drop_list' : 'welcome';
    if (!alreadySubscribed) {
      try {
        const token = await subscriberToken(clean);
        const mail = src === 'drops' ? await dropEmail(clean, token) : await welcomeEmail(clean, token);
        await sendMail({
          to: clean,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          tags: ['nomad', src === 'drops' ? 'drop-list' : 'newsletter-welcome'],
          metadata: { source: src },
          kind,
          unsubToken: token,
          marketing: true,
        });
      } catch (e) {
        console.error('[subscribe] mail failed:', e.message);
        if (!e.logged) await logMail(clean, kind, '', 'failed', e.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
  }
}
