import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// RFC 8058 one-click unsubscribe. Gmail, Yahoo and Outlook POST here directly
// from their own "unsubscribe" button — no confirmation page, no redirect, and
// the body they send (List-Unsubscribe=One-Click) must not be required to parse.
export async function POST(req) {
  const token = new URL(req.url).searchParams.get('t') || '';
  if (!token) return new NextResponse('Missing token', { status: 400 });

  const { data, error } = await supabase().rpc('unsubscribe_by_token', {
    p_token: token.slice(0, 64),
    p_reason: 'one-click (List-Unsubscribe)',
  });

  // Mail providers retry on 5xx, so only report a server error when it really
  // is one; an unknown token is a dead link, not a failure to honour.
  if (error) return new NextResponse('Could not unsubscribe', { status: 500 });
  if (!data?.ok) return new NextResponse('Unknown or already-used link', { status: 404 });
  return new NextResponse('Unsubscribed. You will not hear from us again.', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// Some clients probe with GET first; never unsubscribe on a GET (link
// scanners would fire it), just explain.
export async function GET() {
  return new NextResponse('POST to this URL to unsubscribe (RFC 8058).', {
    status: 405,
    headers: { Allow: 'POST', 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
