import Link from 'next/link';
import { getProducts } from '@/lib/supabase';
import { countrySlug } from '@/lib/format';
import WorldMap from '@/components/WorldMap';

export const revalidate = 60;

export const metadata = {
  title: 'World Map — Everywhere We Have Been',
  description:
    'Every handcrafted object has coordinates. Explore the 29 cities across 18 countries where The Nomad has collected artisan home decor and travel gifts.',
  alternates: { canonical: '/world' },
  openGraph: { url: '/world', type: 'website', siteName: 'The Nomad' },
};

export default async function WorldPage() {
  const products = await getProducts();
  const cityMap = {};
  products.forEach((p) => {
    cityMap[p.city] = cityMap[p.city] || { city: p.city, country: p.country, lat: p.lat, lon: p.lon, count: 0 };
    cityMap[p.city].count++;
  });
  const cities = Object.values(cityMap);
  const countries = new Set(products.map((p) => p.country));

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '70px 40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
          The world map
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 72, lineHeight: 1, margin: '0 0 18px' }}>
          Everywhere we have been
        </h1>
        <p style={{ fontSize: 15, color: '#6B6B68', margin: 0 }}>
          {cities.length} cities · {countries.size} countries · {products.length} objects collected
        </p>
      </div>
      <div style={{ position: 'relative', background: '#F7F7F5', padding: 56 }}>
        <WorldMap cities={cities} aspect="2.2/1" dotSize={24} big />
      </div>
      <div
        className="map-legend"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: '#E8E8E5', marginTop: 1 }}
      >
        {cities.slice(0, 18).map((c) => (
          <Link
            key={c.city}
            href={`/country/${countrySlug(c.country)}`}
            className="hover-card"
            style={{ background: '#FFFFFF', padding: '26px 22px', display: 'block' }}
          >
            <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{c.city}</div>
            <div style={{ fontSize: 11, color: '#6B6B68', marginTop: 8 }}>{c.country}</div>
            <div style={{ fontSize: 11, color: '#B4B0A6', marginTop: 14 }}>
              {c.count} {c.count === 1 ? 'object' : 'objects'}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
