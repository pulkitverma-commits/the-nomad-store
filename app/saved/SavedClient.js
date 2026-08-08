'use client';
import Link from 'next/link';
import { useUi } from '@/components/Ui';
import ProductCard from '@/components/ProductCard';

export default function SavedClient({ products }) {
  const { saved, removeSaved, clearSaved, loaded } = useUi();
  // Preserve the order things were saved in rather than the catalogue order.
  const list = saved.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const missing = saved.length - list.length;

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '70px 40px 0' }}>
      <div
        style={{
          borderBottom: '1px solid #E8E8E5',
          paddingBottom: 34,
          marginBottom: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#6B6B68',
              marginBottom: 20,
            }}
          >
            Set aside
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 76, lineHeight: 1, margin: '0 0 18px' }}
          >
            Saved Objects
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', maxWidth: '54ch', margin: 0 }}>
            Kept in this browser and nowhere else. We are not told what is on this list, and it will
            not follow you to another device — which also means clearing your browser data clears it.
          </p>
        </div>
        {loaded && list.length > 0 && (
          <div
            onClick={clearSaved}
            className="muted-link"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Clear the list
          </div>
        )}
      </div>

      {!loaded ? (
        <div style={{ minHeight: 300 }} />
      ) : list.length === 0 ? (
        <div style={{ padding: '20px 0 40px', maxWidth: '52ch' }}>
          <p
            className="serif"
            style={{ fontSize: 30, lineHeight: 1.5, fontStyle: 'italic', color: '#4A4A47', margin: '0 0 26px' }}
          >
            Nothing set aside yet.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: '#6B6B68', margin: '0 0 34px' }}>
            The heart beside any object puts it here. It is a useful habit with this collection,
            because most things arrive in numbers under ten and we do not restock — the list is
            mainly a way of finding out, the next morning, whether you still want it.
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
            className="grid-4"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '56px 32px' }}
          >
            {list.map((p) => (
              <div key={p.id}>
                <ProductCard p={p} showStock />
                <div
                  onClick={() => removeSaved(p.id)}
                  role="button"
                  aria-label={`Remove ${p.name} from saved`}
                  style={{
                    marginTop: 14,
                    cursor: 'pointer',
                    display: 'inline-block',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#6B6B68',
                    borderBottom: '1px solid #E8E8E5',
                    paddingBottom: 4,
                  }}
                >
                  ♥ Remove
                </div>
              </div>
            ))}
          </div>
          {missing > 0 && (
            <div style={{ fontSize: 12, color: '#B4B0A6', marginTop: 48, lineHeight: 1.8 }}>
              {missing === 1 ? 'One saved object is' : `${missing} saved objects are`} no longer in
              the collection and cannot be shown.{' '}
              <span
                onClick={clearSaved}
                style={{ cursor: 'pointer', borderBottom: '1px solid #E8E8E5' }}
              >
                Clear the list
              </span>{' '}
              to tidy that up.
            </div>
          )}
        </>
      )}
    </main>
  );
}
