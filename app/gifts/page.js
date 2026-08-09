import Link from 'next/link';
import { getProducts } from '@/lib/supabase';
import { countrySlug } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { breadcrumbLd, itemListLd } from '@/lib/seo';
import { GIFT_GUIDES, guideProducts } from '@/lib/giftGuides';

export const revalidate = 60;

export const metadata = {
  title: 'Unique Handcrafted Gifts Under ₹5,000',
  description:
    'Unique gifts for people who have everything: handcrafted objects from 18 countries under ₹5,000, wrapped in unbleached paper with each object’s passport card.',
  alternates: { canonical: '/gifts' },
  openGraph: { url: '/gifts', type: 'website', siteName: 'The Nomad' },
};

export default async function GiftsPage() {
  const products = await getProducts();
  // Every tile is a real destination with a real count. Four of the nine tiles
  // that used to sit here quoted invented figures ("Housewarming · 14 objects")
  // and all nine linked to /shop, so the page told a crawler nothing and a
  // shopper less. Counts are computed from the same rows the guides filter.
  const byCountry = {};
  products.forEach((p) => (byCountry[p.country] = (byCountry[p.country] || 0) + 1));
  const topCountries = Object.keys(byCountry)
    .sort((a, b) => byCountry[b] - byCountry[a])
    .slice(0, 4);

  const tiles = [
    ...GIFT_GUIDES.map((g) => ({
      label: g.heading,
      meta: guideProducts(g, products).length + ' objects',
      href: `/gifts/${g.slug}`,
    })),
    ...topCountries.map((c) => ({
      label: `From ${c}`,
      meta: byCountry[c] + (byCountry[c] === 1 ? ' object' : ' objects'),
      href: `/country/${countrySlug(c)}`,
    })),
    {
      label: 'The whole collection',
      meta: products.length + ' objects, none over ₹5,000',
      href: '/shop',
    },
    { label: 'Corporate gifting', meta: 'By enquiry', href: '/contact' },
  ];
  const picks = products.filter((p) => p.price < 2500).slice(0, 4);

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '70px 40px 0' }}>
      <JsonLd
        data={[
          itemListLd(picks, { path: '/gifts', name: 'The Nomad gift shop' }),
          breadcrumbLd([{ name: 'Gifts', path: '/gifts' }]),
        ]}
      />
      <div style={{ textAlign: 'center', borderBottom: '1px solid #E8E8E5', paddingBottom: 44, marginBottom: 56 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
          The Nomad Gift Shop
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 76, lineHeight: 1, margin: '0 0 20px' }}>
          For people who have everything
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#6B6B68', maxWidth: '52ch', margin: '0 auto' }}>
          Every gift leaves us wrapped in unbleached paper with its passport card, and a note in
          your handwriting if you would like one.
        </p>
      </div>
      <div
        className="grid-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#E8E8E5', marginBottom: 80 }}
      >
        {tiles.map(({ label, meta, href }) => (
          <Link
            key={label}
            href={href}
            className="hover-card gift-tier"
            style={{
              background: '#FFFFFF',
              padding: '44px 36px',
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div className="serif" style={{ fontSize: 32, lineHeight: 1.15, maxWidth: '16ch' }}>{label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B68' }}>
                {meta}
              </div>
              <div style={{ fontSize: 14, color: '#B4B0A6' }}>→</div>
            </div>
          </Link>
        ))}
      </div>
      <h2 className="serif" style={{ fontWeight: 300, fontSize: 40, margin: '0 0 34px' }}>
        Four to start with
      </h2>
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
        {picks.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </main>
  );
}
