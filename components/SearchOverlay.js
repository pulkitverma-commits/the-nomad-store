'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useUi } from './Ui';
import { inr, productImg } from '@/lib/format';

const SUGGESTIONS = ['Japan', 'Ceramic', 'Brass', 'Desk', 'Istanbul', 'Stationery', 'Portugal', 'Marble'];

export default function SearchOverlay({ products }) {
  const { searchOpen, setSearchOpen } = useUi();
  const [query, setQuery] = useState('');
  if (!searchOpen) return null;
  const q = query.trim().toLowerCase();
  const results = q
    ? products
        .filter((p) =>
          `${p.name} ${p.city} ${p.country} ${p.material} ${p.category}`.toLowerCase().includes(q)
        )
        .slice(0, 12)
    : [];
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FFFFFF',
        zIndex: 100,
        animation: 'nfade .3s ease',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
          <div
            onClick={() => setSearchOpen(false)}
            style={{
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#6B6B68',
            }}
          >
            Close
          </div>
        </div>
        <div style={{ borderBottom: '1px solid #111111', paddingBottom: 18, marginBottom: 40 }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search objects, cities, countries, materials"
            className="serif"
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 44, fontWeight: 300, background: 'transparent' }}
          />
        </div>
        {q ? (
          <>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: '#6B6B68',
                marginBottom: 24,
              }}
            >
              {results.length} objects found
            </div>
            <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
              {results.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} onClick={() => setSearchOpen(false)}>
                  <div className="zoomable" style={{ aspectRatio: '4/5', background: p.tone }}>
                    <img src={productImg(p, 400)} alt={p.name} loading="lazy" />
                  </div>
                  <div style={{ fontSize: 14, marginTop: 16 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#6B6B68', marginTop: 6 }}>
                    {p.city}, {p.country} · {inr(p.price)}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: '#6B6B68',
                marginBottom: 24,
              }}
            >
              Try
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {SUGGESTIONS.map((s) => (
                <div key={s} className="city-chip" style={{ fontSize: 13, letterSpacing: 0, textTransform: 'none', color: '#4A4A47' }} onClick={() => setQuery(s)}>
                  {s}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
