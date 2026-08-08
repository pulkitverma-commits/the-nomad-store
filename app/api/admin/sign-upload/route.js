import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

// Signs a Cloudinary upload for an authenticated admin.
// The Cloudinary secret lives in the RLS-protected app_config table —
// only sessions whose email is in admin_users can read it.
export async function POST(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: rows, error } = await sb.from('app_config').select('key,value');
    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    if (!cfg.cloudinary_api_secret) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'nomad';
    const toSign = `folder=${folder}&timestamp=${timestamp}${cfg.cloudinary_api_secret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    return NextResponse.json({
      cloud_name: cfg.cloudinary_cloud_name,
      api_key: cfg.cloudinary_api_key,
      timestamp,
      folder,
      signature,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Signing failed' }, { status: 500 });
  }
}
