import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { customer, items } = await req.json();
    if (!customer?.full_name || !/.+@.+\..+/.test(customer?.email || '')) {
      return NextResponse.json({ error: 'Name and a valid email are required.' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your bag is empty.' }, { status: 400 });
    }
    const clean = items
      .map((i) => ({ product_id: Number(i.product_id), qty: Math.max(1, Math.min(20, Number(i.qty) || 1)) }))
      .filter((i) => Number.isInteger(i.product_id));
    const { data, error } = await supabase().rpc('place_order', {
      p_customer: {
        full_name: String(customer.full_name).slice(0, 200),
        mobile: String(customer.mobile || '').slice(0, 20),
        address: String(customer.address || '').slice(0, 500),
        city: String(customer.city || '').slice(0, 100),
        state: String(customer.state || '').slice(0, 100),
        pin: String(customer.pin || '').slice(0, 10),
        email: String(customer.email).slice(0, 200),
        payment_method: String(customer.payment_method || 'UPI').slice(0, 50),
        gift: !!customer.gift,
        gift_message: String(customer.gift_message || '').slice(0, 500),
      },
      p_items: clean,
    });
    if (error) {
      const msg = /only (\d+) left/.test(error.message)
        ? 'One of the objects in your bag just sold out at that quantity. Please adjust your bag.'
        : 'Could not place the order. Please try again.';
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Could not place the order.' }, { status: 500 });
  }
}
