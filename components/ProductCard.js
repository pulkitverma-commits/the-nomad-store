import Link from 'next/link';
import { inr, productImg, productSrcSet, stockNote } from '@/lib/format';

export default function ProductCard({ p, usePop = false, showStock = false, imgWidth = 500 }) {
  return (
    <Link href={`/product/${p.slug}`} style={{ display: 'block' }}>
      <div
        className="zoomable"
        style={{ aspectRatio: '4/5', background: usePop ? p.pop : p.tone }}
      >
        {/* The card is the most-repeated image on the site — 42 of them on
            /shop alone. `sizes` follows the real grid: four columns on a wide
            screen, two on a tablet, one on a phone, so a 390px device stops
            downloading a 500px-wide negative for a 350px slot. The wrapper
            already fixes the box at 4:5, so nothing here can shift layout. */}
        <img
          src={productImg(p, imgWidth)}
          srcSet={productSrcSet(p, [320, 500, 800])}
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
          alt={`${p.name} — ${p.material}, handcrafted in ${p.city}`}
          width={400}
          height={500}
          loading="lazy"
          decoding="async"
        />
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
