import Link from 'next/link';
import { getProducts } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

export const metadata = {
  title: 'Unique Handcrafted Gifts from Around the World',
  description:
    'Unique gifts for people who have everything: handcrafted home decor gifts under ₹1,500, ₹3,000 and ₹5,000, wrapped in unbleached paper with each object’s passport card.',
};

export default async function GiftsPage() {
  const products = await getProducts();
  const giftCats = [
    ['Under ₹1,500', products.filter((p) => p.price < 1500).length + ' objects'],
    ['Under ₹3,000', products.filter((p) => p.price < 3000).length + ' objects'],
    ['Under ₹5,000', products.length + ' objects'],
    ['Gifts for designers', '11 objects'],
    ['Gifts for travellers', '9 objects'],
    ['Housewarming', '14 objects'],
    ['Desk objects', products.filter((p) => p.category === 'Desk').length + ' objects'],
    ['Objects for people who have everything', '7 objects'],
    ['Corporate gifting', 'By enquiry'],
  ];
  const picks = products.filter((p) => p.price < 2500).slice(0, 4);

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '70px 40px 0' }}>
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
        {giftCats.map(([label, meta]) => (
          <Link
            key={label}
            href="/shop"
            className="hover-card"
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
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
        {picks.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </main>
  );
}
