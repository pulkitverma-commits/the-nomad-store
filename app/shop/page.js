import { getProducts } from '@/lib/supabase';
import JsonLd from '@/components/JsonLd';
import { breadcrumbLd, itemListLd } from '@/lib/seo';
import ShopClient from './ShopClient';

export const revalidate = 60;

export const metadata = {
  title: { absolute: 'All Objects — Handmade Ceramics, Brass & Artisan Decor' },
  description:
    'Browse all 42 handcrafted objects — handmade ceramics, brass decor, marble and letterpress stationery from 18 countries. Filter by country, collection and price.',
  alternates: { canonical: '/shop' },
  openGraph: { url: '/shop', type: 'website', siteName: 'The Nomad' },
};

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <>
      {/* The grid below is a client component, but its markup is server
          rendered, so the ItemList describes objects that are genuinely in the
          initial HTML rather than ones that appear after hydration. */}
      <JsonLd
        data={[
          itemListLd(products, { path: '/shop', name: 'Every object in The Nomad collection' }),
          breadcrumbLd([{ name: 'Objects', path: '/shop' }]),
        ]}
      />
      <ShopClient products={products} />
    </>
  );
}
