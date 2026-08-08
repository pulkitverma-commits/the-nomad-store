'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession } from '@/lib/customerAuth';
import { InlineConfirm } from '@/components/admin/ui';

const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';
const RED = '#B3402A';

const kicker = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: MUTED,
};

const EMPTY = {
  label: '',
  full_name: '',
  mobile: '',
  address: '',
  city: '',
  state: '',
  pin: '',
  is_default: false,
};

function reasonFor(error) {
  const code = String(error?.code || '');
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST202') return 'missing';
  if (code === '42501' || code === 'PGRST301' || error?.status === 401 || error?.status === 403)
    return 'denied';
  return 'error';
}

const REASON_COPY = {
  missing:
    'Saved addresses are not switched on for this store yet. Nothing is wrong with your account — checkout still takes an address the usual way.',
  denied: 'We could not read your addresses just now. Signing out and back in usually settles it.',
  error: 'We could not reach your addresses just now. Please try again in a moment.',
};

// The same line-under-the-field input checkout uses, so an address written
// here and an address written at checkout feel like the same act.
function Field({ placeholder, value, onChange, span }) {
  return (
    <div
      style={{
        gridColumn: span ? 'span 2' : undefined,
        borderBottom: `1px solid ${LINE}`,
        paddingBottom: 11,
      }}
    >
      <input
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-line"
      />
    </div>
  );
}

function Toggle({ on, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0' }}
    >
      <span
        style={{
          width: 34,
          height: 18,
          borderRadius: 9,
          background: on ? INK : '#DEDBD3',
          position: 'relative',
          flex: 'none',
          transition: 'background .25s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#FFFFFF',
            transition: 'left .25s',
          }}
        />
      </span>
      <span style={{ fontSize: 14 }}>{children}</span>
    </div>
  );
}

export default function AddressesClient() {
  const sb = supabaseBrowser();
  const { session, userId, loading } = useCustomerSession();

  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | unavailable
  const [reason, setReason] = useState('error');
  const [editing, setEditing] = useState(null); // null | 'new' | <id>
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data, error: e } = await sb
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (e) {
        setState('unavailable');
        setReason(reasonFor(e));
        return;
      }
      setRows(Array.isArray(data) ? data : []);
      setState('ready');
    } catch (e) {
      setState('unavailable');
      setReason('error');
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setState('unavailable');
      setReason('denied');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, session, loading]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => {
    setError('');
    setForm({ ...EMPTY, is_default: rows.length === 0 });
    setEditing('new');
  };

  const startEdit = (r) => {
    setError('');
    setForm({
      label: r.label || '',
      full_name: r.full_name || '',
      mobile: r.mobile || '',
      address: r.address || '',
      city: r.city || '',
      state: r.state || '',
      pin: r.pin || '',
      is_default: !!r.is_default,
    });
    setEditing(r.id);
  };

  const cancel = () => {
    setEditing(null);
    setError('');
  };

  // Only one row may carry is_default — the database has a unique partial index
  // saying so, and it will reject the write rather than quietly pick a winner.
  // So the old default is always cleared first.
  const clearDefaults = async (exceptId) => {
    let q = sb.from('addresses').update({ is_default: false }).eq('is_default', true);
    if (userId) q = q.eq('user_id', userId);
    if (exceptId) q = q.neq('id', exceptId);
    return q;
  };

  const save = async () => {
    const digits = (s) => String(s || '').replace(/[^0-9]/g, '');
    if (!form.full_name.trim()) return setError('Please tell us who the parcel is for.');
    if (!form.address.trim()) return setError('Please give us a street address.');
    if (form.pin && digits(form.pin).length !== 6)
      return setError('An Indian PIN code is six digits.');
    if (form.mobile && digits(form.mobile).length < 10)
      return setError('That mobile number looks short — the courier will call it.');
    setError('');
    setBusy(true);

    // The first address saved is the default whether or not it was asked for:
    // an account with addresses and no default helps nobody.
    const wantDefault = form.is_default || rows.length === 0;
    const payload = {
      label: form.label.trim() || null,
      full_name: form.full_name.trim(),
      mobile: form.mobile.trim() || null,
      address: form.address.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      pin: form.pin.trim() || null,
      is_default: wantDefault,
    };

    try {
      if (wantDefault) {
        const { error: ce } = await clearDefaults(editing === 'new' ? null : editing);
        if (ce) throw ce;
      }
      const { error: we } =
        editing === 'new'
          ? await sb.from('addresses').insert({ ...payload, user_id: userId })
          : await sb.from('addresses').update(payload).eq('id', editing);
      if (we) throw we;
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (e) {
      setError(
        e?.code === '23505'
          ? 'Another address is still marked as the default. Reload the page and try again.'
          : 'That could not be saved just now. Please try again in a moment.'
      );
    } finally {
      setBusy(false);
    }
  };

  const makeDefault = async (r) => {
    setError('');
    try {
      const { error: ce } = await clearDefaults(r.id);
      if (ce) throw ce;
      const { error: ue } = await sb.from('addresses').update({ is_default: true }).eq('id', r.id);
      if (ue) throw ue;
      await load();
    } catch (e) {
      setError('That could not be changed just now. Please try again in a moment.');
    }
  };

  const remove = async (r) => {
    setError('');
    try {
      const { error: de } = await sb.from('addresses').delete().eq('id', r.id);
      if (de) throw de;
      // Deleting the default leaves the account without one, so the next
      // newest address takes it on.
      const rest = rows.filter((x) => x.id !== r.id);
      if (r.is_default && rest.length > 0) {
        await sb.from('addresses').update({ is_default: true }).eq('id', rest[0].id);
      }
      if (editing === r.id) setEditing(null);
      await load();
    } catch (e) {
      setError('That could not be removed just now. Please try again in a moment.');
    }
  };

  const editingRow = editing && editing !== 'new' ? rows.find((r) => r.id === editing) : null;

  const formPanel = (
    <div style={{ border: `1px solid ${INK}`, padding: 34, marginBottom: 44 }}>
      <div style={{ ...kicker, fontSize: 10, marginBottom: 26 }}>
        {editing === 'new' ? 'A new address' : 'Editing this address'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <Field placeholder="Label — home, studio, mother" value={form.label} onChange={set('label')} span />
        <Field placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
        <Field placeholder="Mobile number" value={form.mobile} onChange={set('mobile')} />
        <Field placeholder="Flat, building, street" value={form.address} onChange={set('address')} span />
        <Field placeholder="City" value={form.city} onChange={set('city')} />
        <Field placeholder="State" value={form.state} onChange={set('state')} />
        <Field placeholder="PIN code" value={form.pin} onChange={set('pin')} />
      </div>

      {editingRow?.is_default ? (
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
          This is the address we suggest first at checkout. To move that, make another one the
          default.
        </div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
          Your first address becomes the one we suggest at checkout.
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <Toggle on={!!form.is_default} onClick={() => set('is_default')(!form.is_default)}>
            Suggest this one first at checkout
          </Toggle>
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: RED, marginBottom: 18 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          className="btn-dark"
          onClick={busy ? undefined : save}
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '16px 30px',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Saving…' : 'Save this address'}
        </div>
        <div
          onClick={cancel}
          className="muted-link"
          style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Never mind
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 44 }}>
        <div style={{ ...kicker, marginBottom: 18 }}>Addresses</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 54, lineHeight: 1.05, margin: '0 0 16px' }}>
          Where we send things
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: 0, maxWidth: '56ch' }}>
          Kept so you do not have to write it out again. One of them is the default — that is the
          one we suggest first at checkout.
        </p>
      </div>

      {state === 'loading' && (
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT }}>
          Looking these up…
        </div>
      )}

      {state === 'unavailable' && (
        <div style={{ border: `1px solid ${LINE}`, padding: '30px 32px', maxWidth: '58ch' }}>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: MUTED, margin: '0 0 22px' }}>
            {REASON_COPY[reason]}
          </p>
          <Link
            href="/shop"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            Look at the objects →
          </Link>
        </div>
      )}

      {state === 'ready' && (
        <>
          {editing ? (
            formPanel
          ) : (
            <div style={{ marginBottom: 44 }}>
              <div
                onClick={startNew}
                className="btn-outline"
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  padding: '16px 30px',
                }}
              >
                Add an address
              </div>
              {error && <div style={{ fontSize: 12, color: RED, marginTop: 18 }}>{error}</div>}
            </div>
          )}

          {rows.length === 0 && !editing ? (
            <div style={{ maxWidth: '52ch' }}>
              <p
                className="serif"
                style={{ fontSize: 30, lineHeight: 1.5, fontStyle: 'italic', color: '#4A4A47', margin: '0 0 26px' }}
              >
                No addresses yet.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.9, color: MUTED, margin: 0 }}>
                Add one and checkout gets shorter. You can keep several — a home, a studio, somebody
                you send things to — and choose which one we reach for first.
              </p>
            </div>
          ) : (
            <div
              className="grid-2"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
            >
              {rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${r.is_default ? INK : LINE}`,
                    padding: 30,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 16,
                      borderBottom: `1px solid ${LINE}`,
                      paddingBottom: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div style={{ ...kicker, fontSize: 9, color: INK }}>{r.label || 'Address'}</div>
                    {r.is_default && (
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          background: '#FCF7E8',
                          border: '1px solid #F2E38F',
                          padding: '4px 10px',
                          color: MUTED,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Default
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 8 }}>{r.full_name}</div>
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.8 }}>
                    {r.address}
                    {(r.city || r.state) && (
                      <>
                        <br />
                        {[r.city, r.state].filter(Boolean).join(', ')}
                      </>
                    )}
                    {r.pin && (
                      <>
                        <br />
                        {r.pin}
                      </>
                    )}
                    {r.mobile && (
                      <>
                        <br />
                        {r.mobile}
                      </>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 20,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      marginTop: 24,
                      paddingTop: 18,
                      borderTop: `1px solid ${LINE}`,
                    }}
                  >
                    <span
                      onClick={() => startEdit(r)}
                      className="muted-link"
                      style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}
                    >
                      Edit
                    </span>
                    {!r.is_default && (
                      <span
                        onClick={() => makeDefault(r)}
                        className="muted-link"
                        style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}
                      >
                        Make default
                      </span>
                    )}
                    <InlineConfirm
                      onConfirm={() => remove(r)}
                      question="Remove this address?"
                    >
                      Remove
                    </InlineConfirm>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: 12, color: FAINT, lineHeight: 1.9, marginTop: 44, maxWidth: '58ch' }}>
            Checkout still asks for an email address for order updates — that one lives with the
            order, not here.
          </p>
        </>
      )}
    </div>
  );
}
