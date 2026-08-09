import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducts } from '@/lib/supabase';
import { countrySlug, inr } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { breadcrumbLd, fitTitle, itemListLd } from '@/lib/seo';
import { GIFT_GUIDES, findGuide, guideProducts } from '@/lib/giftGuides';

// /gifts/<guide> — the three gift edits the inventory actually supports.
//
// Server-rendered end to end: the object grid is in the initial HTML, not
// fetched after hydration, so the products on the page are the products a
// crawler sees. Counts and prices are computed from the same list that renders.

export const revalidate = 60;

export function generateStaticParams() {
  return GIFT_GUIDES.map((g) => ({ guide: g.slug }));
}

export async function generateMetadata({ params }) {
  const g = findGuide(params.guide);
  if (!g) return {};
  const path = `/gifts/${g.slug}`;
  return {
    title: fitTitle(g.metaTitle),
    description: g.metaDescription,
    alternates: { canonical: path },
    openGraph: { url: path, type: 'website', siteName: 'The Nomad' },
  };
}

export default async function GiftGuidePage({ params }) {
  const g = findGuide(params.guide);
  if (!g) notFound();
  const products = await getProducts();
  const list = guideProducts(g, products);
  // A guide with nothing in it is a thin page, so it becomes a 404 rather than
  // an empty shelf. In practice this only fires if the catalogue empties out.
  if (list.length === 0) notFound();

  const countries = [...new Set(list.map((p) => p.country))];
  const cheapest = list[0];
  const dearest = list[list.length - 1];
  const path = `/gifts/${g.slug}`;

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '70px 40px 0' }}>
      <JsonLd
        data={[
          itemListLd(list, { path, name: g.title }),
          breadcrumbLd([
            { name: 'Gifts', path: '/gifts' },
            { name: g.heading, path },
          ]),
        ]}
      />

      <nav
        aria-label="Breadcrumb"
        style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 26 }}
      >
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 8 }}>
          <li><Link href="/gifts" style={{ color: '#B4B0A6' }}>Gifts</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{g.heading}</li>
        </ol>
      </nav>

      <header style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 44, marginBottom: 30 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
          {g.kicker}
        </div>
        <h1
          className="serif"
          style={{ fontWeight: 300, fontSize: 'clamp(44px, 7vw, 76px)', lineHeight: 1, margin: '0 0 20px' }}
        >
          {g.title}
        </h1>
        <p className="serif" style={{ fontSize: 23, lineHeight: 1.55, fontStyle: 'italic', color: '#4A4A47', maxWidth: '38ch', margin: '0 0 28px' }}>
          {g.lede}
        </p>
        {/* Every figure here is counted from the list rendered below, so the
            page cannot claim a number it is not showing. */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', fontSize: 13, color: '#6B6B68' }}>
          <div>
            <strong style={{ color: '#111111', fontWeight: 500 }}>{list.length}</strong> objects
          </div>
          <div>
            <strong style={{ color: '#111111', fontWeight: 500 }}>{countries.length}</strong> countries
          </div>
          <div>
            {inr(cheapest.price)} – {inr(dearest.price)}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '68ch', marginBottom: 64 }}>
        {g.body.map((t, i) => (
          <p key={i} style={{ fontSize: 15, lineHeight: 1.9, color: '#4A4A47', margin: '0 0 20px' }}>
            {t}
          </p>
        ))}
        <p style={{ fontSize: 13, lineHeight: 1.9, color: '#6B6B68', margin: 0 }}>
          Everything below ships free within India over ₹2,500 — see{' '}
          <Link href="/shipping" className="muted-link">how we pack and post</Link> — and can come
          back within fourteen days under our{' '}
          <Link href="/returns" className="muted-link">returns policy</Link>.
        </p>
      </div>

      <h2 className="serif" style={{ fontWeight: 300, fontSize: 40, margin: '0 0 34px' }}>
        {list.length} objects in this guide
      </h2>
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '56px 32px' }}>
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>

      <section style={{ borderTop: '1px solid #E8E8E5', marginTop: 90, paddingTop: 40 }}>
        <h2 className="serif" style={{ fontWeight: 300, fontSize: 32, margin: '0 0 22px' }}>
          Keep looking
        </h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14 }}>
          {GIFT_GUIDES.filter((o) => o.slug !== g.slug).map((o) => (
            <Link key={o.slug} href={`/gifts/${o.slug}`} className="muted-link">
              {o.title}
            </Link>
          ))}
          {countries.slice(0, 4).map((c) => (
            <Link key={c} href={`/country/${countrySlug(c)}`} className="muted-link">
              Objects from {c}
            </Link>
          ))}
          <Link href="/shop" className="muted-link">
            The whole collection
          </Link>
        </div>
      </section>
    </main>
  );
}
