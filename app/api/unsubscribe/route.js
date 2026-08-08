import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET  /api/unsubscribe?t=…  → who is behind this token (masked), and whether
//                              they are still subscribed.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get('t') || '';
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  const { data, error } = await supabase().rpc('unsub_preview', { p_token: token });
  if (error || !data?.ok) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json(data);
}

// POST /api/unsubscribe  { token, reason } → remove them from the list and add
// them to the suppression list that sendMail() checks before every send.
export async function POST(req) {
  try {
    const { token, reason } = await req.json();
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const { data, error } = await supabase().rpc('unsubscribe_by_token', {
      p_token: String(token).slice(0, 64),
      p_reason: reason ? String(reason).slice(0, 300) : null,
    });
    if (error) return NextResponse.json({ error: 'Could not unsubscribe' }, { status: 500 });
    if (!data?.ok) {
      return NextResponse.json({ error: 'That link is not valid any more.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Could not unsubscribe' }, { status: 500 });
  }
}
