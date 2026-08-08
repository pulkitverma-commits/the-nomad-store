'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession } from '@/lib/customerAuth';
import { productImg, countrySlug } from '@/lib/format';
import CollectionMap from '@/components/CollectionMap';

const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';

const kicker = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: MUTED,
};

// The migration may not have been applied to a given environment yet, and a
// customer should never meet a stack trace because of it. Every failure is
// sorted into one of three calm sentences.
function reasonFor(error) {
  const code = String(error?.code || '');
  if (code === 'PGRST202' || code === '42883' || code === '42P01' || code === 'PGRST205')
    return 'missing';
  if (code === '42501' || code === 'PGRST301' || error?.status === 401 || error?.status === 403)
    return 'denied';
  return 'error';
}

const REASON_COPY = {
  missing:
    'Collections are not switched on for this store yet. Nothing is wrong with your account — the shelf simply has not been built.',
  denied:
    'We could not read your collection just now. Signing out and back in usually settles it.',
  error: 'We could not reach your collection just now. Please try again in a moment.',
};

export default function CollectionClient() {
  const sb = supabaseBrowser();
  const { session, loading } = useCustomerSession();

  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | unavailable
  const [reason, setReason] = useState('error');

  useEffect(() => {
    if (loading) return undefined;
    if (!session) {
      setState('unavailable');
      setReason('denied');
      return undefined;
    }
    let alive = true;

    (async () => {
      try {
        const { data, error } = await sb.rpc('my_collection');
        if (!alive) return;
        if (error) {
          setState('unavailable');
          setReason(reasonFor(error));
          return;
        }
        const list = Array.isArray(data) ? data.filter(Boolean) : [];
        setRows(list);
        setState('ready');

        // my_collection does not carry `material`, and the passport wants it.
        // The catalogue is public, so this is a plain read — and entirely
        // optional: if it fails the passport simply shows one line fewer.
        const ids = list.map((r) => r.product_id).filter((v) => v != null);
        if (ids.length === 0) return;
        const { data: prods, error: pErr } = await sb
          .from('products')
          .select('id, material, category')
          .in('id', ids);
        if (!alive || pErr || !Array.isArray(prods)) return;
        const byId = {};
        prods.forEach((p) => {
          byId[p.id] = p;
        });
        setRows((cur) =>
          cur.map((r) => ({
            ...r,
            material: byId[r.product_id]?.material || r.material || '',
            category: byId[r.product_id]?.category || r.category || '',
          }))
        );
      } catch (e) {
        if (alive) {
          setState('unavailable');
          setReason('error');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [sb, session, loading]);

  const objectCount = rows.reduce((t, r) => t + (Number(r.qty) || 1), 0);
  const cityMap = {};
  rows.forEach((r) => {
    if (!r.city) return;
    if (!cityMap[r.city])
      cityMap[r.city] = { city: r.city, country: r.country, lat: r.lat, lon: r.lon, count: 0 };
    cityMap[r.city].count += Number(r.qty) || 1;
  });
  const cities = Object.values(cityMap);
  const countries = [...new Set(rows.map((r) => r.country).filter(Boolean))];

  return (
    <div>
      <div style={{ marginBottom: 44 }}>
        <div style={{ ...kicker, marginBottom: 18 }}>Your collection</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 54, lineHeight: 1.05, margin: '0 0 16px' }}>
          Where your things came from
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: 0, maxWidth: '56ch' }}>
          Everything you have taken home from us, and the places it was found. The map fills in on
          its own as the collection grows.
        </p>
      </div>

      {state === 'loading' && (
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT }}>
          Gathering your objects…
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

      {state === 'ready' && rows.length === 0 && (
        <div style={{ maxWidth: '52ch', paddingBottom: 20 }}>
          <p
            className="serif"
            style={{ fontSize: 30, lineHeight: 1.5, fontStyle: 'italic', color: '#4A4A47', margin: '0 0 26px' }}
          >
            Nothing on the shelf yet.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: MUTED, margin: '0 0 32px' }}>
            When something you have ordered arrives here, its city appears on this map with a pin,
            and its passport — object number, origin, material — sits underneath. Until then the
            world map is the better place to wander: every pin on it is somewhere we have been.
          </p>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/shop"
              className="btn-dark"
              style={{
                display: 'inline-block',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '18px 34px',
              }}
            >
              Look at the objects
            </Link>
            <Link
              href="/world"
              className="underline-link"
              style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED }}
            >
              Or see the world map →
            </Link>
          </div>
        </div>
      )}

      {state === 'ready' && rows.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 56,
              flexWrap: 'wrap',
              borderTop: `1px solid ${INK}`,
              borderBottom: `1px solid ${LINE}`,
              padding: '26px 0 28px',
              marginBottom: 42,
            }}
          >
            {[
              [objectCount, objectCount === 1 ? 'Object' : 'Objects'],
              [cities.length, cities.length === 1 ? 'City' : 'Cities'],
              [countries.length, countries.length === 1 ? 'Country' : 'Countries'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="serif" style={{ fontSize: 46, lineHeight: 1, fontWeight: 300 }}>
                  {n}
                </div>
                <div style={{ ...kicker, fontSize: 9, marginTop: 10 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#F7F7F5', padding: 28, marginBottom: 18 }}>
            <CollectionMap cities={cities} aspect="2.2/1" />
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 64,
            }}
          >
            {cities.map((c) => (
              <Link
                key={c.city}
                href={c.country ? `/country/${countrySlug(c.country)}` : '/world'}
                className="city-chip"
                style={{ display: 'inline-block' }}
              >
                {c.city}
                <span style={{ color: FAINT, marginLeft: 10 }}>{c.count}</span>
              </Link>
            ))}
          </div>

          <div style={{ ...kicker, borderBottom: `1px solid ${INK}`, paddingBottom: 14, marginBottom: 40 }}>
            The objects
          </div>

          <div
            className="grid-3"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '56px 32px' }}
          >
            {rows.map((r) => {
              const passport = [
                ['Origin', [r.city, r.country].filter(Boolean).join(', ')],
                ['Material', r.material],
                ['In your keeping', Number(r.qty) > 1 ? `${r.qty} of them` : 'One'],
                [
                  'Since',
                  r.first_ordered
                    ? new Date(r.first_ordered).toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : '',
                ],
              ].filter(([, v]) => v);

              return (
                <div key={r.product_id}>
                  <Link href={r.slug ? `/product/${r.slug}` : '/shop'} style={{ display: 'block' }}>
                    <div
                      className="zoomable"
                      style={{ aspectRatio: '4/5', background: r.tone || '#F2F1ED' }}
                    >
                      {(r.image_public_id || r.photo_id) && (
                        <img
                          src={productImg(r, 500)}
                          alt={`${r.name}${r.city ? ` — from ${r.city}` : ''}`}
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 14,
                        marginTop: 18,
                        borderBottom: `1px solid ${INK}`,
                        paddingBottom: 12,
                      }}
                    >
                      <div style={{ fontSize: 14, lineHeight: 1.4 }}>{r.name}</div>
                      <div style={{ fontSize: 9, letterSpacing: '0.2em', color: FAINT, whiteSpace: 'nowrap' }}>
                        {r.object_no}
                      </div>
                    </div>
                  </Link>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginTop: 18 }}>
                    {passport.map(([k, v]) => (
                      <div key={k}>
                        <div
                          style={{
                            fontSize: 9,
                            letterSpacing: '0.24em',
                            textTransform: 'uppercase',
                            color: FAINT,
                            marginBottom: 7,
                          }}
                        >
                          {k}
                        </div>
                        <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 12, color: FAINT, lineHeight: 1.9, marginTop: 56, maxWidth: '58ch' }}>
            Objects appear here once an order carrying them is recorded against this email address —
            including orders you placed as a guest, before there was an account.
          </p>
        </>
      )}
    </div>
  );
}
