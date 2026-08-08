import Link from 'next/link';
import { inr, productImg, stockNote } from '@/lib/format';

export default function ProductCard({ p, usePop = false, showStock = false, imgWidth = 500 }) {
  return (
    <Link href={`/product/${p.slug}`} style={{ display: 'block' }}>
      <div
        className="zoomable"
        style={{ aspectRatio: '4/5', background: usePop ? p.pop : p.tone }}
      >
        <img src={productImg(p, imgWidth)} alt={`${p.name} — ${p.material}, handcrafted in ${p.city}`} loading="lazy" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 18 }}>
        <div style={{ fontSize: 14, lineHeight: 1.4 }}>{p.name}</div>
        <div style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{inr(p.price)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#6B6B68' }}>
          {p.city}, {p.country}
        </div>
        {showStock && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#B4B0A6',
            }}
          >
            {stockNote(p.stock)}
          </div>
        )}
      </div>
    </Link>
  );
}
