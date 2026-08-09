import { notFound } from 'next/navigation';
import { getProducts, supabase } from '@/lib/supabase';
import { cld, countrySlug, COUNTRY_PHOTOS } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import { NAV_RESERVE } from '@/lib/nav';

export const revalidate = 60;

async function getCountry(slug) {
  try {
    const { data } = await supabase()
      .from('countries')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    return data || null;
  } catch (e) {
    // A missing table or an RLS change should not take the page down — we fall
    // through to the generic template below.
    return null;
  }
}

// Used when there is no row in `countries` yet (a new country lands in
// `products` before anybody has written its copy).
function fallbackCopy(country, slug, list) {
  return {
    name: country,
    quote: `“Every object from ${country} was chosen in the workshop or market where it is made.”`,
    body: `We travel to ${country} the way we travel everywhere — on foot, without a fixed list, guided by makers and their neighbours. What comes back is meant to be used daily, made well enough to outlive the person who bought it.`,
    hero_public_id: COUNTRY_PHOTOS[slug]
      ? `nomad/${COUNTRY_PHOTOS[slug]}`
      : `nomad/${list[0].photo_id}`,
    hero_caption: `${list[0].city} — where we found ${
      list.length > 1 ? 'these objects' : 'this object'
    }`,
    trips: null,
  };
}

export async function generateMetadata({ params }) {
  const products = await getProducts();
  const country = products.find((p) => countrySlug(p.country) === params.slug)?.country;
  if (!country) return {};
  const row = await getCountry(params.slug);
  return {
    title: `${country} — Handcrafted Objects & Artisan Home Decor`,
    description: row?.body
      ? `${row.body} Shop the objects we brought home from ${country}.`.slice(0, 300)
      : `Shop unique handcrafted objects from ${country}: artisan home decor, handmade ceramics and travel gifts discovered on the ground and brought home to India.`,
    openGraph: row?.hero_public_id ? { images: [cld(row.hero_public_id, 1200)] } : undefined,
  };
}

export default async function CountryPage({ params }) {
  const [products, row] = await Promise.all([getProducts(), getCountry(params.slug)]);
  const list = products.filter((p) => countrySlug(p.country) === params.slug);
  if (list.length === 0) notFound();
  const country = list[0].country;
  const cities = {};
  list.forEach((p) => (cities[p.city] = (cities[p.city] || 0) + 1));
  const copy = row || fallbackCopy(country, params.slug, list);

  return (
    <main>
      <section
        style={{
          background: '#EEECE6',
          // Runs the band up behind the floating header pill instead of
          // leaving the pill's reserved strip showing as white. See lib/nav.js.
          marginTop: -NAV_RESERVE,
          padding: `${96 + NAV_RESERVE}px 40px 96px`,
        }}
      >
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
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#6B6B68',
                marginBottom: 22,
              }}
            >
              The world · {copy.name || country}
            </div>
            <h1
              className="serif"
              style={{ fontWeight: 300, fontSize: 88, lineHeight: 0.95, margin: '0 0 26px' }}
            >
              {copy.name || country}
            </h1>
            <p
              className="serif"
              style={{
                fontSize: 24,
                lineHeight: 1.55,
                fontStyle: 'italic',
                color: '#4A4A47',
                maxWidth: '32ch',
                margin: '0 0 24px',
              }}
            >
              {copy.quote}
            </p>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: '#6B6B68',
                maxWidth: '52ch',
                margin: '0 0 30px',
              }}
            >
              {copy.body}
            </p>
            {copy.trips && (
              <div
                style={{
                  display: 'flex',
                  gap: 36,
                  paddingTop: 22,
                  marginBottom: 30,
                  borderTop: '1px solid #DEDBD3',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: '#8C8880',
                      marginBottom: 8,
                    }}
                  >
                    On the ground
                  </div>
                  <div style={{ fontSize: 14 }}>{copy.trips}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: '#8C8880',
                      marginBottom: 8,
                    }}
                  >
                    Brought home
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {list.length} {list.length === 1 ? 'object' : 'objects'} from{' '}
                    {Object.keys(cities).length}{' '}
                    {Object.keys(cities).length === 1 ? 'city' : 'cities'}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {Object.keys(cities).map((c) => (
                <div key={c} className="city-chip">
                  {c} · {cities[c]}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ aspectRatio: '1', background: '#E4E2DB', overflow: 'hidden' }}>
              <img
                src={cld(copy.hero_public_id, 900)}
                alt={copy.hero_caption || `${country} — a collection trip`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {copy.hero_caption && (
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#8C8880',
                  marginTop: 14,
                }}
              >
                {copy.hero_caption}
              </div>
            )}
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '96px 40px 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
            borderBottom: '1px solid #E8E8E5',
            paddingBottom: 24,
            marginBottom: 48,
          }}
        >
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 42, margin: 0 }}>
            Objects from {country}
          </h2>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#6B6B68',
            }}
          >
            {list.length} objects
          </div>
        </div>
        <div
          className="grid-3"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '56px 32px' }}
        >
          {list.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
