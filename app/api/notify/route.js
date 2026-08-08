import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, item_name } = await req.json();
    if (!/.+@.+\..+/.test(email || '') || !item_name) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { error } = await supabase()
      .from('notify_requests')
      .insert({ email: String(email).slice(0, 200), item_name: String(item_name).slice(0, 200) });
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'Could not save' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
}
