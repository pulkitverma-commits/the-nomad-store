import { notFound } from 'next/navigation';
import { getProducts } from '@/lib/supabase';
import { img, countrySlug, COUNTRY_COPY, COUNTRY_PHOTOS } from '@/lib/format';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const products = await getProducts();
  const country = products.find((p) => countrySlug(p.country) === params.slug)?.country;
  if (!country) return {};
  return {
    title: `${country} — Handcrafted Objects & Artisan Home Decor`,
    description: `Shop unique handcrafted objects from ${country}: artisan home decor, handmade ceramics and travel gifts discovered on the ground and brought home to India.`,
  };
}

export default async function CountryPage({ params }) {
  const products = await getProducts();
  const list = products.filter((p) => countrySlug(p.country) === params.slug);
  if (list.length === 0) notFound();
  const country = list[0].country;
  const cities = {};
  list.forEach((p) => (cities[p.city] = (cities[p.city] || 0) + 1));
  const copy = COUNTRY_COPY[country] || {
    quote: `“Every object from ${country} was chosen in the workshop or market where it is made.”`,
    body: `We travel to ${country} the way we travel everywhere — on foot, without a fixed list, guided by makers and their neighbours. What comes back is meant to be used daily, made well enough to outlive the person who bought it.`,
    heroPhoto: COUNTRY_PHOTOS[params.slug] || list[0].photo_id,
    heroCaption: `${list[0].city} — where we found ${list.length > 1 ? 'these objects' : 'this object'}`,
  };

  return (
    <main>
      <section style={{ background: '#EEECE6', padding: '96px 40px' }}>
        <div
          className="split"
          style={{
            maxWidth: 1560,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 22 }}>
              The world · {country}
            </div>
            <h1 className="serif" style={{ fontWeight: 300, fontSize: 88, lineHeight: 0.95, margin: '0 0 26px' }}>
              {country}
            </h1>
            <p
              className="serif"
              style={{ fontSize: 24, lineHeight: 1.55, fontStyle: 'italic', color: '#4A4A47', maxWidth: '32ch', margin: '0 0 24px' }}
            >
              {copy.quote}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#6B6B68', maxWidth: '52ch', margin: '0 0 36px' }}>
              {copy.body}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {Object.keys(cities).map((c) => (
                <div key={c} className="city-chip">
                  {c} · {cities[c]}
                </div>
              ))}
            </div>
          </div>
          <div style={{ aspectRatio: '1', background: '#E4E2DB', overflow: 'hidden' }}>
            <img
              src={img(copy.heroPhoto, 900)}
              alt={copy.heroCaption}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '96px 40px 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: '1px solid #E8E8E5',
            paddingBottom: 24,
            marginBottom: 48,
          }}
        >
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 42, margin: 0 }}>
            Objects from {country}
          </h2>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6B68' }}>
            {list.length} objects
          </div>
        </div>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '56px 32px' }}>
          {list.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
