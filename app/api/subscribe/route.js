import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, source } = await req.json();
    if (!/.+@.+\..+/.test(email || '')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const { error } = await supabase()
      .from('subscribers')
      .insert({ email: String(email).slice(0, 200), source: String(source || 'newsletter').slice(0, 50) });
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
  }
}
