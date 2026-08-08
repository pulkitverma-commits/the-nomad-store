import { getProducts, getArticles } from '@/lib/supabase';
import { countrySlug } from '@/lib/format';

const BASE = 'https://the-nomad-store.vercel.app';

export default async function sitemap() {
  let products = [];
  let articles = [];
  try {
    [products, articles] = await Promise.all([getProducts(), getArticles()]);
  } catch (e) {}
  const countries = [...new Set(products.map((p) => countrySlug(p.country)))];
  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/shop`, priority: 0.9 },
    { url: `${BASE}/gifts`, priority: 0.8 },
    { url: `${BASE}/drops`, priority: 0.7 },
    { url: `${BASE}/journal`, priority: 0.7 },
    { url: `${BASE}/world`, priority: 0.6 },
    { url: `${BASE}/soon`, priority: 0.5 },
    { url: `${BASE}/shipping`, priority: 0.4 },
    { url: `${BASE}/returns`, priority: 0.4 },
    { url: `${BASE}/contact`, priority: 0.4 },
    { url: `${BASE}/faqs`, priority: 0.5 },
    { url: `${BASE}/terms`, priority: 0.2 },
    { url: `${BASE}/privacy`, priority: 0.2 },
    ...products.map((p) => ({ url: `${BASE}/product/${p.slug}`, priority: 0.8 })),
    ...countries.map((c) => ({ url: `${BASE}/country/${c}`, priority: 0.7 })),
    ...articles.map((a) => ({ url: `${BASE}/journal/${a.slug}`, priority: 0.6 })),
  ];
}
