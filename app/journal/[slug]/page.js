import { notFound } from 'next/navigation';
import { getArticle, getProducts } from '@/lib/supabase';
import { img } from '@/lib/format';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

const ARTICLE_COUNTRY = {
  '48-hours-in-kyoto': 'Japan',
  'what-we-brought-home-from-lisbon': 'Portugal',
  'inside-seoul-s-independent-design-stores': 'South Korea',
  'a-morning-at-istanbul-s-grand-bazaar': 'Türkiye',
  'objects-that-define-japanese-design': 'Japan',
  'why-portuguese-ceramics-look-different': 'Portugal',
  '10-things-we-found-in-amsterdam': 'Netherlands',
  'the-story-behind-moroccan-brasswork': 'Morocco',
  'a-guide-to-tokyo-stationery': 'Japan',
};

export async function generateMetadata({ params }) {
  const a = await getArticle(params.slug);
  if (!a) return {};
  return {
    title: `${a.title} — The Nomad Journal`,
    description: a.excerpt,
    openGraph: { images: [img(a.photo_id, 1200)] },
  };
}

export default async function ArticlePage({ params }) {
  const [a, products] = await Promise.all([getArticle(params.slug), getProducts()]);
  if (!a) notFound();
  const country = ARTICLE_COUNTRY[a.slug];
  const related = products.filter((p) => !country || p.country === country).slice(0, 4);

  return (
    <main>
      <div style={{ height: '62vh', minHeight: 440, background: '#EEECE6', overflow: 'hidden' }}>
        <img
          src={img(a.photo_id, 1800)}
          alt={a.caption}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px 0' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 24 }}>
          {a.kicker} {country ? `· ${country}` : ''} · {a.read_time}
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 66, lineHeight: 1.05, margin: '0 0 30px' }}>
          {a.title}
        </h1>
        <p className="serif" style={{ fontSize: 25, lineHeight: 1.6, fontStyle: 'italic', color: '#4A4A47', margin: '0 0 44px' }}>
          {a.excerpt}
        </p>
        {(a.body || []).map((t, i) => (
          <p key={i} style={{ fontSize: 16, lineHeight: 2, color: '#2A2A28', margin: '0 0 26px' }}>
            {t}
          </p>
        ))}
        <div style={{ borderTop: '1px solid #E8E8E5', borderBottom: '1px solid #E8E8E5', padding: '36px 0', margin: '44px 0' }}>
          <div className="serif" style={{ fontSize: 30, lineHeight: 1.45, fontStyle: 'italic', color: '#111111' }}>
            “We do not buy anything on the first visit. If it is still on our minds the next morning,
            we go back.”
          </div>
        </div>
      </article>
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '60px 40px 0' }}>
        <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 22, marginBottom: 40 }}>
          <h3 className="serif" style={{ fontWeight: 300, fontSize: 38, margin: 0 }}>What we brought home</h3>
        </div>
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {related.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
