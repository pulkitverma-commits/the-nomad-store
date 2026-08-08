import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducts, getProduct } from '@/lib/supabase';
import { inr, img, productImg, deg, stockLine, countrySlug } from '@/lib/format';
import AddToBag from '@/components/AddToBag';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const p = await getProduct(params.slug);
  if (!p) return {};
  return {
    title: `${p.name} — Handcrafted in ${p.city}, ${p.country}`,
    description: `${p.description} ${p.material}, ${inr(p.price)}. A unique handcrafted object discovered in ${p.city} and brought home to India by The Nomad.`,
    openGraph: { images: [productImg(p, 1200)] },
  };
}

export default async function ProductPage({ params }) {
  const [p, all] = await Promise.all([getProduct(params.slug), getProducts()]);
  if (!p) notFound();
  const related = all
    .filter((x) => x.id !== p.id && (x.country === p.country || x.category === p.category))
    .slice(0, 4);
  const specs = [
    { k: 'Origin', v: `${p.city}, ${p.country}` },
    { k: 'Material', v: p.material },
    { k: 'Made by', v: 'Independent artisan studio' },
    { k: 'Dimensions', v: '12 cm × 7 cm' },
    { k: 'Sourced', v: '2026 Nomad Collection' },
  ];
  const passport = [
    { k: 'Origin', v: `${p.city}, ${p.country}` },
    { k: 'Coordinates', v: `${deg(p.lat, 'N', 'S')} / ${deg(p.lon, 'E', 'W')}` },
    { k: 'Discovered', v: 'Spring 2026' },
    { k: 'Category', v: p.category },
    { k: 'Material', v: p.material },
    { k: 'Collection', v: 'No. 0' + (274 + p.id) },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: productImg(p, 1200),
    sku: p.object_no,
    brand: { '@type': 'Brand', name: 'The Nomad' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: p.price,
      availability:
        p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          padding: '22px 40px',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#6B6B68',
        }}
      >
        <Link href="/shop" style={{ color: '#6B6B68' }}>Objects</Link> /{' '}
        <Link href={`/country/${countrySlug(p.country)}`} style={{ color: '#6B6B68' }}>{p.country}</Link> / {p.city}
      </div>
      <section className="split" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 0, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 40 }}>
          <div style={{ aspectRatio: '1', background: p.tone, overflow: 'hidden' }}>
            <img
              src={productImg(p, 1200)}
              alt={`${p.name} — ${p.material}, handcrafted in ${p.city}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ aspectRatio: '1', background: '#F2F1ED', overflow: 'hidden' }}>
              <img
                src={productImg(p, 600)}
                alt={`${p.name} — detail`}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scale(1.35)' }}
              />
            </div>
            <div style={{ aspectRatio: '1', background: '#EDEAE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6' }}>
                In place
              </span>
            </div>
          </div>
        </div>
        <div style={{ position: 'sticky', top: 104, padding: '36px 40px 0 72px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 18 }}>
            {p.object_no}
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 54, lineHeight: 1.05, margin: '0 0 16px' }}>
            {p.name}
          </h1>
          <div style={{ fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 26 }}>
            {p.city}, {p.country}
          </div>
          <div style={{ fontSize: 20, marginBottom: 26 }}>{inr(p.price)}</div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#4A4A47', maxWidth: '44ch', margin: '0 0 30px' }}>
            {p.description}
          </p>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 22 }}>
            {stockLine(p.stock)}
          </div>
          <AddToBag product={p} />
          <div style={{ borderTop: '1px solid #E8E8E5' }}>
            {specs.map((s) => (
              <div
                key={s.k}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: 20,
                  padding: '15px 0',
                  borderBottom: '1px solid #F2F1ED',
                }}
              >
                <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B4B0A6' }}>
                  {s.k}
                </div>
                <div style={{ fontSize: 13, color: '#4A4A47' }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#B4B0A6', marginTop: 18 }}>
            Photo by{' '}
            <a
              href={`https://unsplash.com/@${p.photo_handle}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#B4B0A6', textDecoration: 'underline' }}
            >
              {p.photo_credit}
            </a>{' '}
            on Unsplash
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '120px 40px 0' }}>
        <div
          className="split"
          style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 48, paddingBottom: 48, borderBottom: '1px solid #E8E8E5' }}
        >
          <div style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#111111' }}>
            The Object
          </div>
          <p className="serif" style={{ fontSize: 26, lineHeight: 1.55, color: '#111111', margin: 0, maxWidth: '52ch' }}>
            {p.description} Sized to be used every day rather than displayed, and made in numbers
            small enough that we cannot promise a second one.
          </p>
        </div>
        <div className="split" style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 48, padding: '48px 0' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#111111' }}>
            The Story
          </div>
          <div style={{ maxWidth: '60ch' }}>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: '#4A4A47', margin: '0 0 20px' }}>
              We found this on our {p.city} collection trip, in a workshop we were taken to by someone
              who asked us not to name it. It was not for sale that morning; it was drying on a rack
              by the door.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: '#4A4A47', margin: 0 }}>
              What we look for is not rarity for its own sake. It is the sense that someone made a
              decision — about a curve, a weight, a finish — and then stood by it. This object is the
              result of about forty such decisions.
            </p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '80px 40px 0' }}>
        <div
          className="split"
          style={{ background: '#F7F7F5', padding: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
              Where we found it
            </div>
            <h3 className="serif" style={{ fontWeight: 300, fontSize: 52, lineHeight: 1, margin: '0 0 14px' }}>
              {p.city}
            </h3>
            <div style={{ fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 26 }}>
              {p.country}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.9, color: '#6B6B68', maxWidth: '40ch' }}>
              A short walk from the centre, in a district where workshops still sit between
              apartments and the same families have worked the same trade for three generations.
            </div>
            <div style={{ display: 'flex', gap: 36, marginTop: 32, paddingTop: 24, borderTop: '1px solid #E8E8E5' }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 8 }}>
                  Latitude
                </div>
                <div style={{ fontSize: 14 }}>{deg(p.lat, 'N', 'S')}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 8 }}>
                  Longitude
                </div>
                <div style={{ fontSize: 14 }}>{deg(p.lon, 'E', 'W')}</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E5', padding: 40 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: '1px solid #111111',
                paddingBottom: 14,
                marginBottom: 26,
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
                The Nomad Object Passport
              </div>
              <div className="serif" style={{ fontStyle: 'italic', fontSize: 17, color: '#6B6B68' }}>TN</div>
            </div>
            <div className="serif" style={{ fontSize: 38, lineHeight: 1, marginBottom: 28 }}>{p.object_no}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 32px' }}>
              {passport.map((s) => (
                <div key={s.k}>
                  <div style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 8 }}>
                    {s.k}
                  </div>
                  <div style={{ fontSize: 13, color: '#111111' }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div
              className="serif"
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px dotted #E8E8E5',
                fontStyle: 'italic',
                fontSize: 16,
                color: '#6B6B68',
              }}
            >
              Thank you for giving this object a new home.
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '110px 40px 0' }}>
        <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 24, marginBottom: 44 }}>
          <h3 className="serif" style={{ fontWeight: 300, fontSize: 40, margin: 0 }}>
            You May Also Discover
          </h3>
        </div>
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {related.map((r) => (
            <ProductCard key={r.id} p={r} />
          ))}
        </div>
      </section>
    </main>
  );
}
