import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Order number + the email on the order. find_order is a security-definer RPC
// that matches on both and never returns the lookup token.
export async function POST(req) {
  try {
    const { order_no, email } = await req.json();
    const no = String(order_no || '').trim();
    const mail = String(email || '').trim();
    if (no.length < 6 || !/.+@.+\..+/.test(mail)) {
      return NextResponse.json(
        { error: 'Enter the order number from your confirmation email, and the email you gave us.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase().rpc('find_order', {
      p_order_no: no.slice(0, 40),
      p_email: mail.slice(0, 200),
    });
    if (error) return NextResponse.json({ error: 'Could not look that up.' }, { status: 500 });
    if (!data || data.error) {
      return NextResponse.json(
        { error: 'No order matches that number and email. Check both against your confirmation email.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ order: data });
  } catch (e) {
    return NextResponse.json({ error: 'Could not look that up.' }, { status: 500 });
  }
}
