'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useCustomerSession } from '@/lib/customerAuth';
import { useUi } from '@/components/Ui';
import ProductCard from '@/components/ProductCard';

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

// `merge_saved_objects` returns `setof bigint`. Depending on how PostgREST
// renders a set of scalars we may get [1,2,3] or [{...:1},{...:2}] — accept
// either rather than betting the page on it.
function idsFrom(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => {
      if (row == null) return null;
      if (typeof row === 'object') row = Object.values(row)[0];
      const n = Number(row);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v) => v != null);
}

export default function SavedAccountClient() {
  const sb = supabaseBrowser();
  const { session, loading } = useCustomerSession();
  const ui = useUi() || {};
  const { saved = [], loaded = true, removeSaved } = ui;

  // The local list is read once, when the merge runs. Reading it from a ref
  // keeps removals from re-triggering the merge and resurrecting what was
  // just removed.
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const ran = useRef(false);

  const [ids, setIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | unavailable
  const [synced, setSynced] = useState(true);
  const [merged, setMerged] = useState(0);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (loading || !loaded) return undefined;
    if (!session) {
      setState('unavailable');
      return undefined;
    }
    if (ran.current) return undefined;
    ran.current = true;

    const local = (savedRef.current || [])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));
    let alive = true;

    const loadProducts = async (list) => {
      if (list.length === 0) {
        setProducts([]);
        return;
      }
      const { data, error } = await sb
        .from('products')
        .select('id, slug, name, city, country, material, price, stock, tone, pop, photo_id, image_public_id')
        .in('id', list);
      if (!alive) return;
      if (error || !Array.isArray(data)) {
        // The list is intact; we simply could not fetch what the things are.
        setLookupFailed(true);
        setProducts([]);
        return;
      }
      setLookupFailed(false);
      setProducts(data);
    };

    (async () => {
      try {
        // What the account held before the merge, so we can say honestly how
        // much of this list has just arrived from the browser — and so we have
        // something to fall back on if the RPC is not there.
        const { data: beforeRows } = await sb.from('saved_objects').select('product_id');
        const before = Array.isArray(beforeRows)
          ? beforeRows.map((r) => Number(r.product_id)).filter((v) => Number.isFinite(v))
          : null;

        // The whole point of the RPC: whatever the browser was holding becomes
        // part of the account, and we get the account's full list back.
        const { data, error } = await sb.rpc('merge_saved_objects', { p_ids: local });
        let list;
        if (!error) {
          list = idsFrom(data);
          if (before) setMerged(list.filter((id) => !before.includes(id)).length);
        } else if (before) {
          // No RPC, but the table reads — the account list is still the truth,
          // it simply has not taken this browser's additions.
          list = before;
        } else {
          // Nothing server-side to read. Show the browser's own list so the
          // page is still useful, and say plainly that it is not synced.
          if (!alive) return;
          setSynced(false);
          setIds(local);
          setState('ready');
          await loadProducts(local);
          return;
        }
        if (!alive) return;
        setIds(list);
        setState('ready');
        await loadProducts(list);
      } catch (e) {
        if (alive) setState('unavailable');
      }
    })();

    return () => {
      alive = false;
    };
  }, [sb, session, loading, loaded]);

  const remove = async (id) => {
    setIds((cur) => cur.filter((x) => x !== id));
    // Always drop it locally too: otherwise the next merge would put it back.
    if (removeSaved) removeSaved(id);
    if (!synced) return;
    const { error } = await sb.from('saved_objects').delete().eq('product_id', id);
    if (error) {
      setNote('That one could not be removed from your account. It will come back on refresh.');
    }
  };

  const byId = {};
  products.forEach((p) => {
    byId[p.id] = p;
  });
  // Keep the order the browser had, then anything the account added.
  const ordered = [
    ...(savedRef.current || []).map(Number).filter((id) => ids.includes(id)),
    ...ids.filter((id) => !(savedRef.current || []).map(Number).includes(id)),
  ];
  const list = ordered.map((id) => byId[id]).filter(Boolean);
  const missing = ids.length - list.length;

  return (
    <div>
      <div style={{ marginBottom: 44 }}>
        <div style={{ ...kicker, marginBottom: 18 }}>Set aside</div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 54, lineHeight: 1.05, margin: '0 0 16px' }}>
          Saved objects
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, margin: 0, maxWidth: '56ch' }}>
          {synced
            ? 'Kept with your account now, so the list is the same on your phone as it is here. Saving something is not a hold — most things arrive in numbers under ten, and we do not restock.'
            : 'Kept in this browser for the moment. It will not follow you to another device until we can store it with your account.'}
        </p>
      </div>

      {state === 'loading' && (
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT }}>
          Bringing your list across…
        </div>
      )}

      {state === 'unavailable' && (
        <div style={{ border: `1px solid ${LINE}`, padding: '30px 32px', maxWidth: '58ch' }}>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: MUTED, margin: '0 0 22px' }}>
            We could not reach your saved list just now. Please try again in a moment — nothing has
            been lost.
          </p>
          <Link
            href="/saved"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            The list kept in this browser →
          </Link>
        </div>
      )}

      {state === 'ready' && (
        <>
          {merged > 0 && (
            <div
              style={{
                background: '#FCF7E8',
                border: '1px solid #F2E38F',
                padding: '16px 22px',
                fontSize: 12,
                lineHeight: 1.8,
                color: MUTED,
                marginBottom: 40,
                maxWidth: '58ch',
              }}
            >
              {merged === 1
                ? 'One object you had set aside in this browser has come across to your account.'
                : `${merged} objects you had set aside in this browser have come across to your account.`}
            </div>
          )}

          {list.length === 0 && ids.length > 0 ? (
            <div style={{ border: `1px solid ${LINE}`, padding: '30px 32px', maxWidth: '58ch' }}>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: MUTED, margin: 0 }}>
                {lookupFailed
                  ? `Your list is safe — ${
                      ids.length === 1 ? 'the object on it' : `all ${ids.length} of them`
                    } could not be looked up just now. Please try again in a moment.`
                  : `${
                      ids.length === 1 ? 'The one object on your list is' : 'The objects on your list are'
                    } no longer in the collection and cannot be shown. Sold out things do not come back — we do not restock.`}
              </p>
            </div>
          ) : list.length === 0 ? (
            <div style={{ maxWidth: '52ch', paddingBottom: 20 }}>
              <p
                className="serif"
                style={{ fontSize: 30, lineHeight: 1.5, fontStyle: 'italic', color: '#4A4A47', margin: '0 0 26px' }}
              >
                Nothing set aside yet.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.9, color: MUTED, margin: '0 0 32px' }}>
                The heart beside any object puts it here. It is a useful habit with this collection —
                the list is mainly a way of finding out, the next morning, whether you still want it.
              </p>
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
            </div>
          ) : (
            <>
              <div
                className="grid-3"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '56px 32px' }}
              >
                {list.map((p) => (
                  <div key={p.id}>
                    <ProductCard p={p} showStock />
                    <div
                      onClick={() => remove(p.id)}
                      role="button"
                      aria-label={`Remove ${p.name} from saved`}
                      style={{
                        marginTop: 14,
                        cursor: 'pointer',
                        display: 'inline-block',
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: MUTED,
                        borderBottom: `1px solid ${LINE}`,
                        paddingBottom: 4,
                      }}
                    >
                      ♥ Remove
                    </div>
                  </div>
                ))}
              </div>
              {missing > 0 && !lookupFailed && (
                <div style={{ fontSize: 12, color: FAINT, marginTop: 48, lineHeight: 1.8, maxWidth: '58ch' }}>
                  {missing === 1 ? 'One saved object is' : `${missing} saved objects are`} no longer
                  in the collection and cannot be shown. Sold out things do not come back — we do not
                  restock.
                </div>
              )}
            </>
          )}

          {note && (
            <div style={{ fontSize: 12, color: '#B3402A', marginTop: 28, lineHeight: 1.8 }}>{note}</div>
          )}
        </>
      )}
    </div>
  );
}
