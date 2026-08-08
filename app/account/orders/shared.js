'use client';
import { STEPS } from '@/app/order/[id]/OrderPassport';

// Everything the four account order pages read from the database, in one
// place. It all runs in the browser against the authenticated client, so the
// queries carry no email or user id of their own — the RLS policy on `orders`
// decides what comes back, which is also what lets a signed-in person see the
// orders they placed as a guest.
//
// Nothing here throws. The accounts migration may not have reached the
// database yet, so a missing column, a missing policy or a dropped connection
// all have to end in a calm sentence rather than a spinner that never stops.

export const INK = '#111111';
export const MUTED = '#6B6B68';
export const FAINT = '#B4B0A6';
export const LINE = '#E8E8E5';
export const CREAM = '#FCF7E8';
export const SAND = '#F2E38F';

export { STEPS };

// The order row plus its lines, each line carrying the object it was for. The
// price lives on order_items, not on products — it is what was paid on the
// day, not what the object costs now.
export const ITEM_SELECT =
  'order_items(qty, price, products(id, name, slug, city, country, object_no, photo_id, image_public_id, tone))';

const MAX_ROWS = 200;

export const kicker = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: MUTED,
};

export const cardStyle = {
  background: '#FFFFFF',
  border: `1px solid ${LINE}`,
  padding: 40,
};

export function isOrderId(id) {
  return /^[0-9a-f-]{36}$/i.test(String(id || ''));
}

// First eight characters, uppercased — the same order number the confirmation
// email, /order-lookup and the passport all show.
export function orderNo(id) {
  return String(id || '').slice(0, 8).toUpperCase();
}

export function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export function fmtDateTime(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

export function statusLabel(s) {
  const hit = STEPS.find((x) => x[0] === (s || 'confirmed'));
  if (hit) return hit[1];
  const raw = String(s || '').replace(/[_-]+/g, ' ').trim();
  return raw ? raw[0].toUpperCase() + raw.slice(1) : 'Confirmed';
}

// order_items rows flattened into the shape the rest of the site uses for a
// line: the object's own fields, with the quantity and the price paid on top.
export function itemsOf(order) {
  const rows = order?.order_items;
  if (!Array.isArray(rows)) return [];
  return rows.map((it) => ({
    ...(it.products || {}),
    qty: Number(it.qty) || 0,
    price: Number(it.price) || 0,
  }));
}

export function hasItems(order) {
  return Array.isArray(order?.order_items);
}

export function countItems(order) {
  if (!hasItems(order)) return null;
  return order.order_items.reduce((t, i) => t + (Number(i.qty) || 0), 0);
}

// supabase-js retries a request that has failed at the network layer, with
// backoff and no ceiling — so a database that cannot be reached leaves the
// promise pending for as long as the tab stays open. That was watched in a
// browser: the same query goes out again roughly every twelve seconds, for
// ever. Nothing on an account page is worth a spinner that never stops, so
// every read carries a deadline and becomes a plain sentence once it passes.
export const READ_TIMEOUT_MS = 15000;

const TIMED_OUT = { data: null, error: { message: 'The read took too long.' } };

export function withDeadline(work, ms = READ_TIMEOUT_MS) {
  if (ms <= 0) return Promise.resolve(TIMED_OUT);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r && typeof r === 'object' ? r : TIMED_OUT);
    };
    const timer = setTimeout(() => finish(TIMED_OUT), ms);
    Promise.resolve(work).then(finish, (e) => finish({ data: null, error: e || TIMED_OUT.error }));
  });
}

function selectOrders(sb, select, limit) {
  return sb
    .from('orders')
    .select(select)
    .order('created_at', { ascending: false })
    .limit(limit || MAX_ROWS);
}

// Result shape, everywhere: { orders, detail, failed }.
//  * detail=false means the lines came back empty-handed but the orders
//    themselves are readable — show the orders, quietly drop the item counts.
//  * failed=true means we have nothing at all to show and the page should say
//    so in words.
export async function loadOrders(sb, { limit } = {}) {
  const until = Date.now() + READ_TIMEOUT_MS;
  try {
    const withItems = await withDeadline(
      selectOrders(sb, `*, ${ITEM_SELECT}`, limit),
      until - Date.now()
    );
    if (!withItems.error) return { orders: withItems.data || [], detail: true, failed: false };

    // The embed can fail on its own (no policy on order_items yet) while the
    // orders themselves are perfectly readable. Ask again for less.
    const plain = await withDeadline(selectOrders(sb, '*', limit), until - Date.now());
    if (!plain.error) return { orders: plain.data || [], detail: false, failed: false };

    return { orders: [], detail: false, failed: true };
  } catch (e) {
    return { orders: [], detail: false, failed: true };
  }
}

// One order, by id, through the authenticated client. There is deliberately no
// token here and no fall back to get_order_by_token: on this route the only
// thing that may open an order is the session.
export async function loadOrder(sb, id) {
  if (!isOrderId(id)) return { order: null, detail: false, failed: false };
  const until = Date.now() + READ_TIMEOUT_MS;
  try {
    const withItems = await withDeadline(
      sb.from('orders').select(`*, ${ITEM_SELECT}`).eq('id', id).maybeSingle(),
      until - Date.now()
    );
    if (!withItems.error) {
      return { order: withItems.data || null, detail: true, failed: false };
    }

    const plain = await withDeadline(
      sb.from('orders').select('*').eq('id', id).maybeSingle(),
      until - Date.now()
    );
    if (!plain.error) return { order: plain.data || null, detail: false, failed: false };

    return { order: null, detail: false, failed: true };
  } catch (e) {
    return { order: null, detail: false, failed: true };
  }
}
