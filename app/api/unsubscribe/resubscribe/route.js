import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// The escape hatch on the unsubscribe page. Gated on the same token that did
// the unsubscribing, so nobody can put an address back on the list except the
// person holding the link we emailed to it.
export async function POST(req) {
  try {
    const { token, source } = await req.json();
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const { data, error } = await supabase().rpc('resubscribe_by_token', {
      p_token: String(token).slice(0, 64),
      p_source: source === 'drops' ? 'drops' : 'newsletter',
    });
    if (error) return NextResponse.json({ error: 'Could not resubscribe' }, { status: 500 });
    if (!data?.ok) {
      return NextResponse.json({ error: 'That link is not valid any more.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Could not resubscribe' }, { status: 500 });
  }
}
