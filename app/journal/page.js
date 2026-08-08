import Link from 'next/link';
import { getArticles } from '@/lib/supabase';
import { img } from '@/lib/format';

export const revalidate = 60;

export const metadata = {
  title: 'The Nomad Journal — Notes from the Places Our Objects Come From',
  description:
    'City guides, field notes and craft stories from The Nomad’s collection trips: Kyoto, Lisbon, Seoul, Istanbul, Marrakech and beyond.',
};

export default async function JournalPage() {
  const articles = await getArticles();
  const featured = articles.find((a) => a.slug === '48-hours-in-kyoto') || articles[0];
  const rest = articles.filter((a) => a.slug !== featured.slug);

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '70px 40px 0' }}>
      <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 40, marginBottom: 56 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
          The Nomad Journal
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 76, lineHeight: 1, margin: 0, maxWidth: '18ch' }}>
          Notes from the places our objects come from
        </h1>
      </div>
      <Link
        href={`/journal/${featured.slug}`}
        className="split"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: 64,
          alignItems: 'center',
          marginBottom: 88,
        }}
      >
        <div className="zoomable" style={{ aspectRatio: '16/10', background: '#EDEAE3' }}>
          <img src={img(featured.photo_id, 1200)} alt={featured.caption} />
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
            {featured.kicker} · {featured.read_time}
          </div>
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 20px' }}>
            {featured.title}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', maxWidth: '44ch', margin: '0 0 28px' }}>
            {featured.excerpt}
          </p>
          <span className="underline-link" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Read the story →
          </span>
        </div>
      </Link>
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '56px 36px' }}>
        {rest.map((j) => (
          <Link key={j.slug} href={`/journal/${j.slug}`} style={{ display: 'block' }}>
            <div className="zoomable" style={{ aspectRatio: '3/2', background: j.tone }}>
              <img src={img(j.photo_id, 600)} alt={j.caption} loading="lazy" />
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#6B6B68', marginTop: 20 }}>
              {j.kicker}
            </div>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1.2, marginTop: 12 }}>{j.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: '#6B6B68', marginTop: 12 }}>{j.excerpt}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
