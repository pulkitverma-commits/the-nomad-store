import { getProducts, getArticles } from '@/lib/supabase';
import { countrySlug } from '@/lib/format';
import { SITE_URL } from '@/lib/site';
import { GIFT_GUIDES } from '@/lib/giftGuides';

const BASE = SITE_URL;

// Static routes that are indexable and worth listing. Everything absent from
// here is absent on purpose: /checkout, /account/**, /order/**, /order-lookup,
// /signin, /saved, /unsubscribe and /admin all send `noindex`, and a noindexed
// URL in a sitemap is a direct contradiction for a crawler to resolve.
//
// No `lastModified` on any of these. Nothing in the codebase records when a
// static page's copy last changed, and stamping them with the deploy date
// would tell Search Console that fifteen pages change every time anything
// ships — which is how a sitemap's dates stop being believed.
const STATIC = [
  ['/', 1.0, 'daily'],
  ['/shop', 0.9, 'daily'],
  ['/gifts', 0.8, 'weekly'],
  ['/drops', 0.7, 'weekly'],
  ['/journal', 0.7, 'weekly'],
  ['/world', 0.6, 'monthly'],
  ['/about', 0.6, 'monthly'],
  ['/voices', 0.6, 'monthly'],
  ['/soon', 0.5, 'weekly'],
  ['/faqs', 0.5, 'monthly'],
  ['/shipping', 0.4, 'yearly'],
  ['/returns', 0.4, 'yearly'],
  ['/contact', 0.4, 'yearly'],
  ['/terms', 0.2, 'yearly'],
  ['/privacy', 0.2, 'yearly'],
];

// A Postgres timestamp to the Date the sitemap serialiser wants. Anything
// unparseable is dropped rather than guessed at.
function when(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// Image sitemap entries are deliberately absent: Next 14.2's sitemap route
// silently drops an `images` key rather than emitting <image:image>, so adding
// them here would look like coverage without producing any. Doing it properly
// means hand-writing the XML, which is on the Phase-2 list.
export default async function sitemap() {
  let products = [];
  let articles = [];
  try {
    [products, articles] = await Promise.all([getProducts(), getArticles()]);
  } catch (e) {
    // A database blip should still leave a valid sitemap of the static pages
    // rather than a 500 that Search Console records as a fetch failure.
  }

  const countries = [...new Set(products.map((p) => countrySlug(p.country)))];
  // The most recently added object in each country stands in for when that
  // country page last changed — it is the only real timestamp behind it.
  const countryTouched = {};
  products.forEach((p) => {
    const slug = countrySlug(p.country);
    const d = when(p.created_at);
    if (d && (!countryTouched[slug] || d > countryTouched[slug])) countryTouched[slug] = d;
  });
  const newestProduct = Object.values(countryTouched).sort((a, b) => b - a)[0];
  const newestArticle = articles
    .map((a) => when(a.created_at))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  return [
    ...STATIC.map(([url, priority, changeFrequency]) => ({
      url: `${BASE}${url === '/' ? '' : url}`,
      priority,
      changeFrequency,
      // Only the three listing pages have a defensible date: they visibly
      // change when a product or an article is added.
      lastModified:
        url === '/' || url === '/shop'
          ? newestProduct
          : url === '/journal'
            ? newestArticle
            : undefined,
    })),

    ...GIFT_GUIDES.map((g) => ({
      url: `${BASE}/gifts/${g.slug}`,
      priority: 0.7,
      changeFrequency: 'weekly',
      lastModified: newestProduct,
    })),

    ...products.map((p) => ({
      url: `${BASE}/product/${p.slug}`,
      priority: 0.8,
      changeFrequency: 'weekly',
      lastModified: when(p.created_at),
    })),

    ...countries.map((c) => ({
      url: `${BASE}/country/${c}`,
      priority: 0.7,
      changeFrequency: 'weekly',
      lastModified: countryTouched[c],
    })),

    ...articles.map((a) => ({
      url: `${BASE}/journal/${a.slug}`,
      priority: 0.6,
      changeFrequency: 'monthly',
      lastModified: when(a.created_at),
    })),
  ];
}
