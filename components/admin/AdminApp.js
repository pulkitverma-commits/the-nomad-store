'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { inr, productImg } from '@/lib/format';
import { label, th, td, inputStyle, btn, btnGhost, linkAction, InlineConfirm } from './ui';
import { Journal, Drops, ComingSoon, Voices } from './Collections';

/* ─────────────── LOGIN ─────────────── */

// The four social logins we have wired, in the order we want them shown.
// `key` is the provider name Supabase expects — note LinkedIn's current
// provider is `linkedin_oidc` (plain `linkedin` is the retired one), and
// Instagram has no provider of its own: Instagram Login runs through Meta,
// so it goes via `facebook`.
const OAUTH_PROVIDERS = [
  { key: 'google', name: 'Google' },
  { key: 'azure', name: 'Microsoft' },
  { key: 'linkedin_oidc', name: 'LinkedIn' },
  { key: 'facebook', name: 'Instagram / Meta' },
];

function Login({ onError, error }) {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  // Which providers are actually switched on in Supabase. signInWithOAuth
  // navigates away rather than returning an error, so a provider that is not
  // enabled dumps the user on a raw JSON error page. Ask Supabase first —
  // /auth/v1/settings is public — and only offer the ones that will work.
  // null = not asked yet, so we render nothing rather than flashing buttons.
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setEnabled(d?.external || {});
      })
      .catch(() => {
        if (alive) setEnabled({});
      });
    return () => {
      alive = false;
    };
  }, []);

  const signIn = async () => {
    setBusy(true);
    onError('');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) onError(error.message);
    setBusy(false);
  };
  const magicLink = async () => {
    setNote('');
    if (!/.+@.+\..+/.test(email)) return onError('Enter your email above first, then request the link.');
    setBusy(true);
    onError('');
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
        // Without this, anyone could type any address on this page and have
        // Supabase mint them an account. Magic links are for staff who already
        // have one; they are not a signup route.
        shouldCreateUser: false,
      },
    });
    setBusy(false);
    if (error) {
      // "Signups not allowed for otp" is Supabase telling us the address has no
      // account. Say that in English rather than leaking the API's wording.
      onError(
        /signups not allowed/i.test(error.message)
          ? 'No back-office account for that address. Ask an admin to create one first.'
          : error.message
      );
    } else setNote('Magic link sent — check your inbox.');
  };
  const oauth = (provider) => async () => {
    setNote('');
    onError('');
    const { error } = await sb.auth.signInWithOAuth({
      provider: provider.key,
      options: { redirectTo: typeof window !== 'undefined' ? window.location.href : undefined },
    });
    // Rarely reached — the call normally navigates away — but if the provider
    // was switched off between page load and click, say so in English.
    if (error) {
      onError(`${provider.name} sign-in is not switched on in Supabase Auth yet.`);
    }
  };

  const live = enabled ? OAUTH_PROVIDERS.filter((p) => enabled[p.key]) : [];
  const pending = enabled ? OAUTH_PROVIDERS.filter((p) => !enabled[p.key]) : [];

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '110px 24px 0' }}>
      <div style={{ ...label, marginBottom: 18 }}>The Nomad · Back office</div>
      <h1 className="serif" style={{ fontWeight: 300, fontSize: 52, margin: '0 0 34px' }}>Admin</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          style={inputStyle}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <input
          style={inputStyle}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && signIn()}
          autoComplete="current-password"
        />
        <button style={{ ...btn, padding: 16, opacity: busy ? 0.6 : 1 }} onClick={signIn} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button style={btnGhost} onClick={magicLink} disabled={busy}>
          Email me a magic link
        </button>
        {live.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {live.map((p) => (
              <button key={p.key} style={btnGhost} onClick={oauth(p)}>
                {p.name}
              </button>
            ))}
          </div>
        )}
        {pending.length > 0 && (
          <div style={{ fontSize: 11, lineHeight: 1.7, color: '#B4B0A6', marginTop: 2 }}>
            {pending.map((p) => p.name).join(', ')} sign-in appear{pending.length === 1 ? 's' : ''} here
            once switched on in Supabase Auth.
          </div>
        )}
      </div>
      {note && <div style={{ fontSize: 13, color: '#5F7355', marginTop: 18 }}>{note}</div>}
      {error && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 18 }}>{error}</div>}
    </main>
  );
}

/* ─────────────── PRODUCTS ─────────────── */
function ImageUpload({ product, onDone }) {
  const sb = supabaseBrowser();
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    setBusy(true);
    try {
      const { data: sess } = await sb.auth.getSession();
      const token = sess?.session?.access_token;
      const sigRes = await fetch('/api/admin/sign-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const sig = await sigRes.json();
      if (!sigRes.ok) throw new Error(sig.error || 'Could not sign upload');
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.api_key);
      form.append('timestamp', sig.timestamp);
      form.append('folder', sig.folder);
      form.append('signature', sig.signature);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
        method: 'POST',
        body: form,
      });
      const uploaded = await up.json();
      if (!up.ok) throw new Error(uploaded?.error?.message || 'Upload failed');
      await onDone(uploaded.public_id);
    } catch (e) {
      alert(e.message);
    }
    setBusy(false);
  };
  return (
    <label style={{ ...btnGhost, display: 'inline-block' }}>
      {busy ? 'Uploading…' : product ? 'Replace image' : 'Upload image'}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
    </label>
  );
}

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  city: '',
  country: '',
  country_code: '',
  price: 0,
  category: 'Table',
  material: '',
  description: '',
  stock: 0,
  lat: 0,
  lon: 0,
  tone: '#F2F1ED',
  pop: '#F6E3A1',
  object_no: '',
  photo_id: null,
  image_public_id: null,
};

function ProductEditor({ product, onClose, onSaved }) {
  const sb = supabaseBrowser();
  const isNew = !product?.id;
  const [p, setP] = useState(product || EMPTY_PRODUCT);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, cast) => (e) => setP({ ...p, [k]: cast ? cast(e.target.value) : e.target.value });

  const save = async () => {
    setErr('');
    if (!p.name || !p.city || !p.country || !p.price) return setErr('Name, city, country and price are required.');
    setBusy(true);
    const row = { ...p };
    delete row.id;
    delete row.created_at;
    if (!row.slug) row.slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!row.country_code) row.country_code = p.country.slice(0, 2).toUpperCase();
    if (!row.object_no)
      row.object_no = `Object #${row.country_code}-${p.city.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const q = isNew
      ? sb.from('products').insert(row)
      : sb.from('products').update(row).eq('id', product.id);
    const { error } = await q;
    setBusy(false);
    if (error) return setErr(error.message);
    onSaved();
    onClose();
  };

  const fields = [
    ['name', 'Name', null, null, true],
    ['city', 'City'],
    ['country', 'Country'],
    ['price', 'Price (₹)', 'number', Number],
    ['stock', 'Stock', 'number', Number],
    ['category', 'Category'],
    ['material', 'Material'],
    ['description', 'Description', null, null, true],
    ['lat', 'Latitude', 'number', Number],
    ['lon', 'Longitude', 'number', Number],
    ['object_no', 'Object no. (auto if blank)', null, null, true],
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.3)', zIndex: 80 }} />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(560px,100vw)',
          background: '#FFFFFF',
          zIndex: 90,
          overflowY: 'auto',
          padding: 36,
          animation: 'ndrawer .3s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 34, margin: 0 }}>
            {isNew ? 'New object' : p.name}
          </h2>
          <div onClick={onClose} style={{ ...label, cursor: 'pointer' }}>Close</div>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 26 }}>
          <div style={{ width: 96, height: 120, background: p.tone, overflow: 'hidden', flex: 'none' }}>
            {(p.image_public_id || p.photo_id) && (
              <img src={productImg(p, 200)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <ImageUpload
            product={p.image_public_id}
            onDone={async (publicId) => {
              setP((prev) => ({ ...prev, image_public_id: publicId }));
              if (!isNew) await sb.from('products').update({ image_public_id: publicId }).eq('id', product.id);
              onSaved();
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fields.map(([k, l, type, cast, wide]) => (
            <div key={k} style={{ gridColumn: wide ? 'span 2' : undefined }}>
              <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>{l}</div>
              <input style={inputStyle} type={type || 'text'} value={p[k] ?? ''} onChange={set(k, cast)} />
            </div>
          ))}
        </div>
        {err && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 18 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button style={{ ...btn, flex: 1, padding: 15, opacity: busy ? 0.6 : 1 }} onClick={save} disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Create object' : 'Save changes'}
          </button>
        </div>
      </aside>
    </>
  );
}

function Products() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    const { data } = await sb.from('products').select('*').order('id');
    setRows(data || []);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const quickSet = async (id, patch) => {
    await sb.from('products').update(patch).eq('id', id);
    load();
  };

  const remove = async (id) => {
    setErr('');
    const { error } = await sb.from('products').delete().eq('id', id);
    // An object that has already been ordered is referenced by order_items and
    // cannot be deleted — say so rather than failing silently.
    if (error)
      setErr(
        /foreign key|violates/i.test(error.message)
          ? 'This object appears on an order, so it cannot be deleted. Set its stock to 0 instead.'
          : error.message
      );
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={label}>{rows.length} objects</div>
        <button style={btn} onClick={() => setCreating(true)}>+ New object</button>
      </div>
      {err && <div style={{ fontSize: 13, color: '#B3402A', marginBottom: 16 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}></th>
            <th style={th}>Object</th>
            <th style={th}>Origin</th>
            <th style={th}>Price</th>
            <th style={th}>Stock</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td style={{ ...td, width: 52 }}>
                <div style={{ width: 40, height: 50, background: p.tone, overflow: 'hidden' }}>
                  <img src={productImg(p, 100)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </td>
              <td style={td}>
                <div>{p.name}</div>
                <div style={{ fontSize: 10, color: '#B4B0A6', marginTop: 3 }}>{p.object_no}</div>
              </td>
              <td style={td}>{p.city}, {p.country}</td>
              <td style={{ ...td, width: 110 }}>
                <input
                  style={{ ...inputStyle, padding: '6px 8px', width: 90 }}
                  type="number"
                  defaultValue={p.price}
                  onBlur={(e) => Number(e.target.value) !== p.price && quickSet(p.id, { price: Number(e.target.value) })}
                />
              </td>
              <td style={{ ...td, width: 90 }}>
                <input
                  style={{ ...inputStyle, padding: '6px 8px', width: 64 }}
                  type="number"
                  defaultValue={p.stock}
                  onBlur={(e) => Number(e.target.value) !== p.stock && quickSet(p.id, { stock: Number(e.target.value) })}
                />
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span onClick={() => setEditing(p)} style={{ ...linkAction, marginRight: 18 }}>
                  Edit
                </span>
                <InlineConfirm onConfirm={() => remove(p.id)} question={`Delete ${p.name}?`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(editing || creating) && (
        <ProductEditor
          product={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}

/* ─────────────── ORDERS ─────────────── */

const ORDER_FLOW = ['confirmed', 'packed', 'shipped', 'delivered'];
const STATUS_TINT = {
  confirmed: '#6B6B68',
  packed: '#8A7B2F',
  shipped: '#3F5F7A',
  delivered: '#5F7355',
};

function StatusControl({ order, token, onDone }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(order.status || 'confirmed');
  const [courier, setCourier] = useState(order.courier || '');
  const [tracking, setTracking] = useState(order.tracking_number || '');
  const [note, setNote] = useState(order.status_note || '');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          order_id: order.id,
          status,
          courier,
          tracking_number: tracking,
          status_note: note,
          notify,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update.');
      setMsg(
        data.mailed === 'sent'
          ? `Marked ${data.status}. Written to ${order.email}.`
          : `Marked ${data.status}. No email ${data.mailed === 'failed' ? '(the send failed)' : 'sent'}.`
      );
      onDone();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F2F1ED' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#FFFDF4',
            background: STATUS_TINT[order.status] || '#6B6B68',
            padding: '6px 12px',
          }}
        >
          {order.status || 'confirmed'}
        </span>
        {order.tracking_number && (
          <span style={{ fontSize: 12, color: '#6B6B68' }}>
            {order.courier || 'Courier'} · {order.tracking_number}
          </span>
        )}
        <span onClick={() => setOpen(!open)} style={{ ...linkAction, marginLeft: 'auto' }}>
          {open ? 'Close' : 'Move it along'}
        </span>
      </div>

      {open && (
        <div style={{ marginTop: 18, background: '#FCF7E8', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
            {ORDER_FLOW.map((s) => (
              <span
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  padding: '11px 6px',
                  border: `1px solid ${status === s ? '#111111' : '#E8E8E5'}`,
                  background: status === s ? '#111111' : 'transparent',
                  color: status === s ? '#FFFDF4' : '#6B6B68',
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>Courier</div>
              <input style={inputStyle} value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Blue Dart" />
            </div>
            <div>
              <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>Tracking number</div>
              <input style={inputStyle} value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>A line for the customer (optional)</div>
              <input
                style={inputStyle}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Packed with the wax seal you asked for."
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: '#4A4A47', display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              Write to {order.email}
            </label>
            <button style={{ ...btn, marginLeft: 'auto', opacity: busy ? 0.6 : 1 }} onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Update order'}
            </button>
          </div>
          {msg && <div style={{ fontSize: 13, color: '#5F7355', marginTop: 14 }}>{msg}</div>}
          {err && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 14 }}>{err}</div>}
        </div>
      )}
    </div>
  );
}

function Orders({ token }) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => {
    const { data } = await sb
      .from('orders')
      .select('*, order_items(qty, price, products(name, object_no))')
      .order('created_at', { ascending: false });
    setRows(data || []);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  if (!rows) return <div style={label}>Loading…</div>;
  if (rows.length === 0)
    return <div className="serif" style={{ fontSize: 24, color: '#6B6B68' }}>No orders yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {rows.map((o) => (
        <div key={o.id} style={{ border: '1px solid #E8E8E5', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{o.full_name}</span>
              <span style={{ fontSize: 12, color: '#6B6B68', marginLeft: 12 }}>{o.email} · {o.mobile}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B6B68' }}>
              <span style={{ color: '#B4B0A6', marginRight: 12 }}>{String(o.id).slice(0, 8).toUpperCase()}</span>
              {new Date(o.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6B6B68', marginBottom: 14 }}>
            {[o.address, o.city, o.state, o.pin].filter(Boolean).join(', ') || 'No address given'}
          </div>
          {(o.order_items || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px dotted #E8E8E5' }}>
              <span>
                {it.products?.name} × {it.qty}
                <span style={{ color: '#B4B0A6', marginLeft: 10, fontSize: 11 }}>{it.products?.object_no}</span>
              </span>
              <span>{inr(it.price * it.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, fontSize: 14 }}>
            <span>
              {o.payment_method}
              {o.gift ? ' · gift wrapped' : ''}
            </span>
            <strong>{inr(o.total)}</strong>
          </div>
          <StatusControl order={o} token={token} onDone={load} />
        </div>
      ))}
    </div>
  );
}

/* ─────────────── SIGNUPS ─────────────── */
function Signups() {
  const sb = supabaseBrowser();
  const [subs, setSubs] = useState([]);
  const [notify, setNotify] = useState([]);
  useEffect(() => {
    sb.from('subscribers').select('*').order('created_at', { ascending: false }).then(({ data }) => setSubs(data || []));
    sb.from('notify_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setNotify(data || []));
  }, [sb]);
  const Section = ({ title, rows, cols }) => (
    <div style={{ marginBottom: 44 }}>
      <div style={{ ...label, borderBottom: '1px solid #111111', paddingBottom: 12, marginBottom: 4 }}>
        {title} · {rows.length}
      </div>
      {rows.length === 0 && <div style={{ fontSize: 13, color: '#B4B0A6', padding: '14px 0' }}>None yet.</div>}
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 0', borderBottom: '1px solid #F2F1ED', fontSize: 13 }}>
          <span>{r.email}</span>
          <span style={{ color: '#6B6B68' }}>{cols(r)}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div>
      <Section
        title="Newsletter — Postcards"
        rows={subs.filter((s) => s.source === 'newsletter')}
        cols={(r) => new Date(r.created_at).toLocaleDateString('en-IN')}
      />
      <Section
        title="Drop list"
        rows={subs.filter((s) => s.source === 'drops')}
        cols={(r) => new Date(r.created_at).toLocaleDateString('en-IN')}
      />
      <Section title="Notify me" rows={notify} cols={(r) => r.item_name} />
    </div>
  );
}


/* ─────────────── EMAILS ─────────────── */
const MAIL_KINDS = [
  ['welcome', 'Newsletter welcome', 'Sent on first newsletter signup — features a live object from the collection'],
  ['drops', 'Drop list', 'Sent when someone joins the drop list — live countdown to the next drop'],
  ['notify', 'Notify me', 'Sent when someone watches an in-transit object'],
  ['order', 'Order confirmation', 'Sent after checkout — an Object Passport for every item, and a link to track it'],
  ['shipped', 'On its way', 'Sent when an order is marked shipped — courier, tracking number, timeline'],
  ['landed', 'It landed', 'Sent to everyone watching a Coming Soon object when it becomes a product'],
  ['dropday', 'Drop day', 'Sent by the morning cron to the drop list when a drop opens'],
];

function Emails() {
  const sb = supabaseBrowser();
  const [log, setLog] = useState([]);
  const [preview, setPreview] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setToken(data?.session?.access_token || ''));
    sb.from('mail_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setLog(data || []));
  }, [sb]);

  return (
    <div>
      <div style={{ ...label, borderBottom: '1px solid #111111', paddingBottom: 12, marginBottom: 18 }}>
        Templates · previewed with live data
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 44 }}>
        {MAIL_KINDS.map(([k, title, note]) => (
          <div key={k} style={{ border: '1px solid #E8E8E5', padding: '20px 22px' }}>
            <div style={{ fontSize: 15, marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#6B6B68', lineHeight: 1.6, marginBottom: 16 }}>{note}</div>
            <button style={btnGhost} onClick={() => setPreview(k)}>Preview</button>
          </div>
        ))}
      </div>

      <div style={{ ...label, borderBottom: '1px solid #111111', paddingBottom: 12, marginBottom: 4 }}>
        Recent sends · {log.length}
      </div>
      {log.length === 0 && (
        <div style={{ fontSize: 13, color: '#B4B0A6', padding: '16px 0' }}>Nothing sent yet.</div>
      )}
      {log.map((m) => (
        <div
          key={m.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 2fr auto',
            gap: 16,
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #F2F1ED',
            fontSize: 13,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: m.status === 'sent' ? '#5F7355' : '#B3402A',
            }}
          >
            {m.kind}
          </span>
          <span>{m.email}</span>
          <span style={{ color: '#6B6B68', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.subject || m.error}
          </span>
          <span style={{ color: '#B4B0A6', fontSize: 11 }}>
            {new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </span>
        </div>
      ))}

      {preview && (
        <>
          <div
            onClick={() => setPreview(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.4)', zIndex: 80 }}
          />
          <div
            style={{
              position: 'fixed',
              inset: '4% 6%',
              background: '#FFFFFF',
              zIndex: 90,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 80px rgba(17,17,17,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '1px solid #E8E8E5',
              }}
            >
              <div style={label}>{MAIL_KINDS.find((k) => k[0] === preview)?.[1]}</div>
              <div onClick={() => setPreview(null)} style={{ ...label, cursor: 'pointer' }}>Close</div>
            </div>
            <iframe
              title="preview"
              src={`/api/admin/mail-preview?kind=${preview}&token=${encodeURIComponent(token)}`}
              style={{ flex: 1, border: 'none', width: '100%' }}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────── SHELL ─────────────── */
export default function AdminApp() {
  const sb = supabaseBrowser();
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('products');
  const [error, setError] = useState('');
  const token = session?.access_token || '';

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    sb.rpc('is_admin').then(({ data }) => setIsAdmin(!!data));
  }, [session, sb]);

  if (session === undefined) return null;
  if (!session) return <Login onError={setError} error={error} />;
  if (isAdmin === false)
    return (
      <main style={{ maxWidth: 500, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <div className="serif" style={{ fontSize: 30, marginBottom: 16 }}>Not an admin account</div>
        <div style={{ fontSize: 13, color: '#6B6B68', marginBottom: 26 }}>
          {session.user.email} is signed in but not on the admin list.
        </div>
        <button style={btn} onClick={() => sb.auth.signOut()}>Sign out</button>
      </main>
    );
  if (isAdmin === null) return null;

  const tabs = [
    ['products', 'Products'],
    ['orders', 'Orders'],
    ['journal', 'Journal'],
    ['drops', 'Drops'],
    ['soon', 'Coming soon'],
    ['voices', 'Voices'],
    ['signups', 'Signups'],
    ['emails', 'Emails'],
  ];
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E8E8E5', paddingBottom: 26, marginBottom: 36 }}>
        <div>
          <div style={{ ...label, marginBottom: 14 }}>The Nomad · Back office</div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 46, margin: 0 }}>Admin</h1>
        </div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6B6B68' }}>{session.user.email}</span>
          <span
            onClick={() => sb.auth.signOut()}
            style={{ cursor: 'pointer', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', borderBottom: '1px solid #111111', paddingBottom: 2 }}
          >
            Sign out
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 26, marginBottom: 36, flexWrap: 'wrap' }}>
        {tabs.map(([k, l]) => (
          <div
            key={k}
            onClick={() => setTab(k)}
            style={{
              cursor: 'pointer',
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              paddingBottom: 8,
              borderBottom: tab === k ? '2px solid #111111' : '2px solid transparent',
              color: tab === k ? '#111111' : '#6B6B68',
            }}
          >
            {l}
          </div>
        ))}
      </div>
      {tab === 'products' && <Products />}
      {tab === 'orders' && <Orders token={token} />}
      {tab === 'journal' && <Journal />}
      {tab === 'drops' && <Drops />}
      {tab === 'soon' && <ComingSoon token={token} />}
      {tab === 'voices' && <Voices />}
      {tab === 'signups' && <Signups />}
      {tab === 'emails' && <Emails />}
      <div style={{ height: 80 }} />
    </main>
  );
}
