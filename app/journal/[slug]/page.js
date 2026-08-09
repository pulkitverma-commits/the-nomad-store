import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticle, getProducts } from '@/lib/supabase';
import { img, srcSetFor, countrySlug } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { abs, articleLd, breadcrumbLd, trimTo } from '@/lib/seo';
import { ARTICLE_COUNTRY } from '@/lib/related';

export const revalidate = 60;


export async function generateMetadata({ params }) {
  const a = await getArticle(params.slug);
  if (!a) return {};
  const path = `/journal/${a.slug}`;
  const country = ARTICLE_COUNTRY[a.slug];
  // The raw excerpt ran 51–67 characters — true, but well under what a result
  // will show. The country and the read time are real fields on the row, so
  // they extend it without inventing anything.
  return {
    // Already ends in "The Nomad Journal" — appending " · The Nomad" to that
    // was saying the brand twice in one title.
    title: { absolute: `${a.title} — The Nomad Journal` },
    description: trimTo(
      `${a.excerpt}${country ? ` A field note from ${country}` : ' A field note'}${a.read_time ? `, ${a.read_time} read` : ''}, from The Nomad's collection trips.`,
      158
    ),
    alternates: { canonical: path },
    openGraph: {
      url: path,
      type: 'article',
      siteName: 'The Nomad',
      images: [img(a.photo_id, 1200)],
      publishedTime: a.created_at || undefined,
    },
  };
}

export default async function ArticlePage({ params }) {
  const [a, products] = await Promise.all([getArticle(params.slug), getProducts()]);
  if (!a) notFound();
  const country = ARTICLE_COUNTRY[a.slug];
  const related = products.filter((p) => !country || p.country === country).slice(0, 4);

  const path = `/journal/${a.slug}`;

  return (
    <main>
      <JsonLd
        data={[
          articleLd(a, { url: abs(path), image: img(a.photo_id, 1200) }),
          breadcrumbLd([
            { name: 'Journal', path: '/journal' },
            { name: a.title, path },
          ]),
        ]}
      />
      <div style={{ height: '62vh', minHeight: 440, background: '#EEECE6', overflow: 'hidden' }}>
        <img
          src={img(a.photo_id, 1800)}
          srcSet={srcSetFor(`nomad/${a.photo_id}`, [900, 1200, 1800])}
          sizes="100vw"
          alt={a.caption}
          // The cover is the largest paint on the page and sits at the very
          // top, so it is the LCP element on every article. Everything else
          // here stays lazy.
          fetchPriority="high"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px 0' }}>
        <nav
          aria-label="Breadcrumb"
          style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 18 }}
        >
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 8 }}>
            <li><Link href="/journal" style={{ color: '#B4B0A6' }}>Journal</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{a.kicker}</li>
          </ol>
        </nav>
        <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 24 }}>
          {a.kicker} {country ? `· ${country}` : ''} · {a.read_time}
        </div>
        {/* Attribution and a real publication date, both of which the article
            markup claims and neither of which the page used to show. */}
        {a.created_at && (
          <div style={{ fontSize: 12, color: '#8C8880', marginBottom: 20 }}>
            By The Nomad ·{' '}
            <time dateTime={a.created_at}>
              {new Date(a.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>
        )}
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
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 38, margin: 0 }}>
            What we brought home{country ? ` from ${country}` : ''}
          </h2>
          {country && (
            <div style={{ marginTop: 14, fontSize: 13 }}>
              <Link href={`/country/${countrySlug(country)}`} className="muted-link">
                Every object we have brought back from {country}
              </Link>
            </div>
          )}
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
