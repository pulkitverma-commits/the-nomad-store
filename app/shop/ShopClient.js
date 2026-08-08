'use client';
import { useState } from 'react';
import ProductCard from '@/components/ProductCard';

const CATS = ['Table', 'Desk', 'Home', 'Stationery', 'Art', 'Objects', 'Vintage'];
const PRICES = ['Under ₹1,500', '₹1,500 – ₹3,000', 'Above ₹3,000'];

function FilterGroup({ title, rows, current, onPick }) {
  return (
    <>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: '#111111',
          paddingBottom: 14,
          borderBottom: '1px solid #111111',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 36 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            className="filter-row"
            onClick={() => onPick(current === r.label ? 'All' : r.label)}
            style={{ color: current === r.label ? '#111111' : '#6B6B68' }}
          >
            <span>{r.label}</span>
            <span style={{ color: '#B4B0A6', fontSize: 11 }}>{r.count}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ShopClient({ products }) {
  const [fCountry, setCountry] = useState('All');
  const [fCat, setCat] = useState('All');
  const [fPrice, setPrice] = useState('All');

  const countryCounts = {};
  products.forEach((p) => (countryCounts[p.country] = (countryCounts[p.country] || 0) + 1));
  const countryList = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]);

  const filtered = products.filter((p) => {
    if (fCountry !== 'All' && p.country !== fCountry) return false;
    if (fCat !== 'All' && p.category !== fCat) return false;
    if (fPrice === 'Under ₹1,500' && p.price >= 1500) return false;
    if (fPrice === '₹1,500 – ₹3,000' && (p.price < 1500 || p.price > 3000)) return false;
    if (fPrice === 'Above ₹3,000' && p.price <= 3000) return false;
    return true;
  });

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '64px 40px 0' }}>
      <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 34, marginBottom: 48 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 18 }}>
          The archive
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 64, lineHeight: 1, margin: '0 0 16px' }}>
          All Objects
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B68', margin: 0 }}>
          {filtered.length} objects · {countryList.length} countries · updated weekly
        </p>
      </div>
      <div
        className="shop-layout"
        style={{ display: 'grid', gridTemplateColumns: '224px 1fr', gap: 64, alignItems: 'start' }}
      >
        <aside style={{ position: 'sticky', top: 104 }}>
          <FilterGroup
            title="Country"
            rows={countryList.map((c) => ({ label: c, count: countryCounts[c] }))}
            current={fCountry}
            onPick={setCountry}
          />
          <FilterGroup
            title="Collection"
            rows={CATS.map((c) => ({ label: c, count: products.filter((p) => p.category === c).length }))}
            current={fCat}
            onPick={setCat}
          />
          <FilterGroup
            title="Price"
            rows={[
              { label: PRICES[0], count: products.filter((p) => p.price < 1500).length },
              { label: PRICES[1], count: products.filter((p) => p.price >= 1500 && p.price <= 3000).length },
              { label: PRICES[2], count: products.filter((p) => p.price > 3000).length },
            ]}
            current={fPrice}
            onPick={setPrice}
          />
          <div
            className="muted-link"
            onClick={() => {
              setCountry('All');
              setCat('All');
              setPrice('All');
            }}
            style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'inline-block' }}
          >
            Clear all
          </div>
        </aside>
        <div>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '56px 32px' }}>
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} showStock />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
