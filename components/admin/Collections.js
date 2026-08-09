'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { label, th, td, inputStyle, btn, btnGhost, linkAction, InlineConfirm, Drawer, Field, slugify } from './ui';

/* ─────────────── JOURNAL ─────────────── */

const EMPTY_ARTICLE = {
  slug: '',
  kicker: '',
  title: '',
  excerpt: '',
  caption: '',
  tone: '#F2F1ED',
  photo_id: '',
  photo_credit: '',
  photo_handle: '',
  read_time: '',
  body: [],
};

// The body column is a jsonb array of paragraphs. Editors think in blank lines.
const bodyToText = (b) => (Array.isArray(b) ? b : []).join('\n\n');
const textToBody = (t) =>
  String(t || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

function ArticleEditor({ article, onClose, onSaved }) {
  const sb = supabaseBrowser();
  const isNew = !article?.id;
  const [a, setA] = useState(article || EMPTY_ARTICLE);
  const [bodyText, setBodyText] = useState(bodyToText(article?.body));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (v) => setA((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setErr('');
    if (!a.title || !a.kicker) return setErr('A kicker and a title, at minimum.');
    setBusy(true);
    const row = { ...a, body: textToBody(bodyText) };
    delete row.id;
    delete row.created_at;
    if (!row.slug) row.slug = slugify(a.title);
    const { error } = isNew
      ? await sb.from('journal_articles').insert(row)
      : await sb.from('journal_articles').update(row).eq('id', article.id);
    setBusy(false);
    if (error) return setErr(error.message);
    onSaved();
    onClose();
  };

  return (
    <Drawer title={isNew ? 'New article' : a.title} onClose={onClose} width={640}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Kicker" value={a.kicker} onChange={set('kicker')} />
        <Field label="Read time" value={a.read_time} onChange={set('read_time')} />
        <Field label="Title" value={a.title} onChange={set('title')} wide />
        <Field label="Slug (auto if blank)" value={a.slug} onChange={set('slug')} wide />
        <Field label="Excerpt" value={a.excerpt} onChange={set('excerpt')} wide rows={2} />
        <Field label="Photo id (Unsplash or Cloudinary)" value={a.photo_id} onChange={set('photo_id')} wide />
        <Field label="Photo credit" value={a.photo_credit} onChange={set('photo_credit')} />
        <Field label="Photo handle" value={a.photo_handle} onChange={set('photo_handle')} />
        <Field label="Caption" value={a.caption} onChange={set('caption')} />
        <Field label="Tone" value={a.tone} onChange={set('tone')} />
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>
          Body · one blank line between paragraphs ({textToBody(bodyText).length} paragraphs)
        </div>
        <textarea
          style={{ ...inputStyle, minHeight: 320, lineHeight: 1.7, resize: 'vertical' }}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
        />
      </div>

      {err && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 18 }}>{err}</div>}
      <div style={{ marginTop: 26 }}>
        <button style={{ ...btn, width: '100%', padding: 15, opacity: busy ? 0.6 : 1 }} onClick={save} disabled={busy}>
          {busy ? 'Saving…' : isNew ? 'Publish article' : 'Save changes'}
        </button>
      </div>
    </Drawer>
  );
}

export function Journal() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const { data } = await sb.from('journal_articles').select('*').order('id');
    setRows(data || []);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    const { error } = await sb.from('journal_articles').delete().eq('id', id);
    if (error) setErr(error.message);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={label}>{rows.length} articles</div>
        <button style={btn} onClick={() => setCreating(true)}>+ New article</button>
      </div>
      {err && <div style={{ fontSize: 13, color: '#B3402A', marginBottom: 16 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Article</th>
            <th style={th}>Kicker</th>
            <th style={th}>Paragraphs</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td style={td}>
                <div>{a.title}</div>
                <div style={{ fontSize: 10, color: '#B4B0A6', marginTop: 3 }}>/journal/{a.slug}</div>
              </td>
              <td style={td}>{a.kicker}</td>
              <td style={td}>{(a.body || []).length}</td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span onClick={() => setEditing(a)} style={{ ...linkAction, marginRight: 18 }}>Edit</span>
                <InlineConfirm onConfirm={() => remove(a.id)} question="Delete this article?" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(editing || creating) && (
        <ArticleEditor
          article={editing}
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

/* ─────────────── DROPS ─────────────── */

const EMPTY_DROP = { drop_no: '', city: '', note: '', status: 'Upcoming' };
const DROP_STATUSES = ['Upcoming', 'Sold through', 'Archived'];

export function Drops() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const { data } = await sb.from('drops').select('*').order('id');
    setRows(data || []);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const row = { ...draft };
    const id = row.id;
    delete row.id;
    const { error } = id
      ? await sb.from('drops').update(row).eq('id', id)
      : await sb.from('drops').insert(row);
    if (error) return setErr(error.message);
    setDraft(null);
    load();
  };
  const remove = async (id) => {
    const { error } = await sb.from('drops').delete().eq('id', id);
    if (error) setErr(error.message);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={label}>{rows.length} drops</div>
        <button style={btn} onClick={() => setDraft(EMPTY_DROP)}>+ New drop</button>
      </div>
      <div style={{ fontSize: 12, color: '#6B6B68', lineHeight: 1.7, marginBottom: 22, maxWidth: '62ch' }}>
        The morning cron writes to the drop list about whichever drop is marked{' '}
        <strong>Upcoming</strong>, once and once only. Set a drop back to Upcoming and it will be
        announced again only if it has never been announced before.
      </div>
      {err && <div style={{ fontSize: 13, color: '#B3402A', marginBottom: 16 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>No.</th>
            <th style={th}>City</th>
            <th style={th}>Note</th>
            <th style={th}>Status</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td style={td}>{d.drop_no}</td>
              <td style={td}>{d.city}</td>
              <td style={{ ...td, color: '#6B6B68' }}>{d.note}</td>
              <td style={td}>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: /upcoming/i.test(d.status || '') ? '#5F7355' : '#6B6B68',
                  }}
                >
                  {d.status}
                </span>
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span onClick={() => setDraft(d)} style={{ ...linkAction, marginRight: 18 }}>Edit</span>
                <InlineConfirm onConfirm={() => remove(d.id)} question="Delete this drop?" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {draft && (
        <Drawer title={draft.id ? draft.drop_no : 'New drop'} onClose={() => setDraft(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Drop no." value={draft.drop_no} onChange={(v) => setDraft({ ...draft, drop_no: v })} />
            <Field label="City" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
            <Field label="Note" value={draft.note} onChange={(v) => setDraft({ ...draft, note: v })} wide />
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>Status</div>
              <select
                style={inputStyle}
                value={draft.status || ''}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                {[...new Set([...DROP_STATUSES, draft.status].filter(Boolean))].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button style={{ ...btn, width: '100%', padding: 15, marginTop: 26 }} onClick={save}>
            {draft.id ? 'Save changes' : 'Create drop'}
          </button>
        </Drawer>
      )}
    </div>
  );
}

/* ─────────────── COMING SOON ─────────────── */

const EMPTY_SOON = { obj_no: '', name: '', origin: '', eta: '', photo_id: '', image_public_id: '' };

export function ComingSoon({ token }) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [waiting, setWaiting] = useState({});
  const [draft, setDraft] = useState(null);
  const [landing, setLanding] = useState(null); // { id, product_id }
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: soon }, { data: prods }, { data: notify }] = await Promise.all([
      sb.from('coming_soon').select('*').order('id'),
      sb.from('products').select('id,name,slug,city,country').order('name'),
      sb.from('notify_requests').select('item_name,notified_at'),
    ]);
    setRows(soon || []);
    setProducts(prods || []);
    const counts = {};
    (notify || []).forEach((n) => {
      counts[n.item_name] = counts[n.item_name] || { total: 0, pending: 0 };
      counts[n.item_name].total += 1;
      if (!n.notified_at) counts[n.item_name].pending += 1;
    });
    setWaiting(counts);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const row = { ...draft };
    const id = row.id;
    delete row.id;
    const { error } = id
      ? await sb.from('coming_soon').update(row).eq('id', id)
      : await sb.from('coming_soon').insert(row);
    if (error) return setErr(error.message);
    setDraft(null);
    load();
  };
  const remove = async (id) => {
    const { error } = await sb.from('coming_soon').delete().eq('id', id);
    if (error) setErr(error.message);
    load();
  };

  const markLanded = async () => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/notify-landed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coming_soon_id: landing.id, product_id: Number(landing.product_id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send.');
      setMsg(
        `${data.item} → ${data.product}. ${data.waiting} waiting · ${data.sent} written to${
          data.suppressed ? ` · ${data.suppressed} suppressed` : ''
        }${data.failed ? ` · ${data.failed} failed` : ''}.`
      );
      setLanding(null);
      load();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={label}>{rows.length} in transit</div>
        <button style={btn} onClick={() => setDraft(EMPTY_SOON)}>+ New object</button>
      </div>
      {msg && <div style={{ fontSize: 13, color: '#5F7355', marginBottom: 16 }}>{msg}</div>}
      {err && <div style={{ fontSize: 13, color: '#B3402A', marginBottom: 16 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Object</th>
            <th style={th}>Origin</th>
            <th style={th}>ETA</th>
            <th style={th}>Watching</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const w = waiting[s.name] || { total: 0, pending: 0 };
            const landed = products.find((p) => p.id === s.landed_product_id);
            return (
              <tr key={s.id}>
                <td style={td}>
                  <div>{s.name}</div>
                  <div style={{ fontSize: 10, color: '#B4B0A6', marginTop: 3 }}>
                    {s.obj_no}
                    {landed ? ` · landed as ${landed.name}` : ''}
                  </div>
                </td>
                <td style={td}>{s.origin}</td>
                <td style={td}>{s.eta}</td>
                <td style={td}>
                  {w.total}
                  {w.pending ? (
                    <span style={{ color: '#B3402A', marginLeft: 8, fontSize: 11 }}>{w.pending} unwritten</span>
                  ) : null}
                </td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span
                    onClick={() => setLanding({ id: s.id, product_id: s.landed_product_id || '' })}
                    style={{ ...linkAction, marginRight: 18 }}
                  >
                    Mark landed
                  </span>
                  <span onClick={() => setDraft(s)} style={{ ...linkAction, marginRight: 18 }}>Edit</span>
                  <InlineConfirm onConfirm={() => remove(s.id)} question="Delete this object?" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {draft && (
        <Drawer title={draft.id ? draft.name : 'New in-transit object'} onClose={() => setDraft(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Object no." value={draft.obj_no} onChange={(v) => setDraft({ ...draft, obj_no: v })} />
            <Field label="ETA" value={draft.eta} onChange={(v) => setDraft({ ...draft, eta: v })} />
            <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} wide />
            <Field label="Origin" value={draft.origin} onChange={(v) => setDraft({ ...draft, origin: v })} wide />
            <Field
              label="Image public id (optional)"
              value={draft.image_public_id}
              onChange={(v) => setDraft({ ...draft, image_public_id: v })}
              wide
            />
          </div>
          <button style={{ ...btn, width: '100%', padding: 15, marginTop: 26 }} onClick={save}>
            {draft.id ? 'Save changes' : 'Add object'}
          </button>
        </Drawer>
      )}

      {landing && (
        <Drawer title="It landed" onClose={() => setLanding(null)}>
          <div style={{ fontSize: 13, color: '#6B6B68', lineHeight: 1.8, marginBottom: 24 }}>
            Choose the product this object became. Everyone who asked to be told — and has not been
            told yet — is written to once, and then marked as written to.
          </div>
          <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>Product</div>
          <select
            style={inputStyle}
            value={landing.product_id}
            onChange={(e) => setLanding({ ...landing, product_id: e.target.value })}
          >
            <option value="">Choose…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.city}, {p.country}
              </option>
            ))}
          </select>
          <button
            style={{ ...btn, width: '100%', padding: 15, marginTop: 26, opacity: busy || !landing.product_id ? 0.5 : 1 }}
            disabled={busy || !landing.product_id}
            onClick={markLanded}
          >
            {busy ? 'Writing…' : 'Mark landed and write to the watchers'}
          </button>
        </Drawer>
      )}
    </div>
  );
}

/* ─────────────── VOICES ─────────────── */

const EMPTY_VOICE = {
  quote: '',
  name: '',
  city: '',
  country: '',
  object: '',
  source_email: '',
  featured: false,
  published: false,
  sort_order: 0,
};

function Toggle({ on, onChange, children, note }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0' }}
    >
      <div
        style={{
          width: 34,
          height: 20,
          borderRadius: 999,
          background: on ? '#111111' : '#E8E8E5',
          position: 'relative',
          flexShrink: 0,
          transition: 'background .15s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: on ? 17 : 3,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: '#FFFFFF',
            transition: 'left .15s',
          }}
        />
      </div>
      <div>
        <div style={{ fontSize: 13 }}>{children}</div>
        {note && <div style={{ fontSize: 11, color: '#6B6B68', marginTop: 3, lineHeight: 1.5 }}>{note}</div>}
      </div>
    </div>
  );
}

function VoiceEditor({ voice, onClose, onSaved }) {
  const sb = supabaseBrowser();
  const isNew = !voice?.id;
  const [v, setV] = useState(voice || EMPTY_VOICE);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (val) => setV((prev) => ({ ...prev, [k]: val }));

  const save = async () => {
    setErr('');
    if (!v.quote.trim() || !v.name.trim()) return setErr('A quote and a name, at minimum.');
    if (v.published && !v.source_email.trim()) {
      // The one hard gate. A published letter has to be traceable to whoever
      // sent it — that is what the Consumer Protection Act and the BIS review
      // standard assume, and it is what lets us answer "can I see the original?"
      return setErr('Publishing needs the sender’s email on record. Keep it unpublished until you have it.');
    }
    setBusy(true);
    const row = { ...v };
    delete row.id;
    delete row.created_at;
    const { error } = isNew
      ? await sb.from('testimonials').insert(row)
      : await sb.from('testimonials').update(row).eq('id', voice.id);
    setBusy(false);
    if (error) return setErr(error.message);
    onSaved();
    onClose();
  };

  return (
    <Drawer title={isNew ? 'New letter' : v.name} onClose={onClose} width={620}>
      <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>
        The letter · exactly as they wrote it ({v.quote.trim().length} characters)
      </div>
      <textarea
        style={{ ...inputStyle, minHeight: 180, lineHeight: 1.7, resize: 'vertical' }}
        value={v.quote}
        onChange={(e) => set('quote')(e.target.value)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
        <Field label="Name as shown" value={v.name} onChange={set('name')} />
        <Field label="City" value={v.city} onChange={set('city')} />
        <Field label="Object and date" value={v.object} onChange={set('object')} wide />
        <Field label="Country (for the counted figures)" value={v.country} onChange={set('country')} />
        <Field label="Sort order" value={v.sort_order} onChange={set('sort_order')} type="number" />
        <Field label="Sender’s email · kept private, never shown" value={v.source_email} onChange={set('source_email')} wide />
      </div>

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #E8E8E5' }}>
        <Toggle
          on={v.published}
          onChange={set('published')}
          note="Nothing appears on the shop until this is on. Needs the sender’s email and their permission."
        >
          Published
        </Toggle>
        <Toggle
          on={v.featured}
          onChange={set('featured')}
          note="Runs large at the top of /voices and leads the home page."
        >
          Featured
        </Toggle>
      </div>

      {err && <div style={{ fontSize: 13, color: '#B3402A', marginTop: 18, lineHeight: 1.6 }}>{err}</div>}
      <div style={{ marginTop: 26 }}>
        <button style={{ ...btn, width: '100%', padding: 15, opacity: busy ? 0.6 : 1 }} onClick={save} disabled={busy}>
          {busy ? 'Saving…' : isNew ? 'Save letter' : 'Save changes'}
        </button>
      </div>
    </Drawer>
  );
}

export function Voices() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await sb
      .from('testimonials')
      .select('*')
      .order('sort_order')
      .order('id');
    if (error) setErr(error.message);
    setRows(data || []);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    const { error } = await sb.from('testimonials').delete().eq('id', id);
    if (error) setErr(error.message);
    load();
  };

  const togglePublished = async (r) => {
    if (!r.published && !r.source_email) {
      return setErr(`Cannot publish ${r.name} without the sender’s email on record. Open it and add one.`);
    }
    setErr('');
    const { error } = await sb.from('testimonials').update({ published: !r.published }).eq('id', r.id);
    if (error) setErr(error.message);
    load();
  };

  const live = rows.filter((r) => r.published).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={label}>
          {rows.length} {rows.length === 1 ? 'letter' : 'letters'} · {live} live
        </div>
        <button style={btn} onClick={() => setCreating(true)}>+ New letter</button>
      </div>

      <div style={{ fontSize: 12, lineHeight: 1.7, color: '#6B6B68', marginBottom: 22, maxWidth: '70ch' }}>
        Only published letters reach the shop. Publish one you actually received, from someone who
        is happy to be quoted, and keep their email against it — a published review is expected to
        trace back to a real buyer.
      </div>

      {err && <div style={{ fontSize: 13, color: '#B3402A', marginBottom: 16 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Letter</th>
            <th style={th}>From</th>
            <th style={th}>State</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ ...td, maxWidth: 460 }}>
                <div style={{ lineHeight: 1.6 }}>
                  “{r.quote.length > 130 ? `${r.quote.slice(0, 130)}…` : r.quote}”
                </div>
                {r.object && (
                  <div style={{ fontSize: 10, color: '#B4B0A6', marginTop: 5 }}>{r.object}</div>
                )}
              </td>
              <td style={td}>
                <div>{r.name}</div>
                <div style={{ fontSize: 10, color: '#B4B0A6', marginTop: 3 }}>
                  {[r.city, r.country].filter(Boolean).join(' · ') || '—'}
                </div>
              </td>
              <td style={td}>
                <span
                  onClick={() => togglePublished(r)}
                  style={{
                    cursor: 'pointer',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: r.published ? '#2F6B4F' : '#B4B0A6',
                  }}
                >
                  {r.published ? '● Live' : '○ Draft'}
                </span>
                {r.featured && (
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B68', marginTop: 6 }}>
                    Featured
                  </div>
                )}
                {!r.source_email && (
                  <div style={{ fontSize: 10, color: '#B3402A', marginTop: 6 }}>No sender on record</div>
                )}
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span onClick={() => setEditing(r)} style={{ ...linkAction, marginRight: 18 }}>Edit</span>
                <InlineConfirm onConfirm={() => remove(r.id)} question="Delete this letter?" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div style={{ fontSize: 13, color: '#6B6B68', padding: '30px 0' }}>
          No letters yet. When somebody writes in, add it here.
        </div>
      )}

      {(editing || creating) && (
        <VoiceEditor
          voice={editing}
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
