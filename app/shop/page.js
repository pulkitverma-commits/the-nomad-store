import { getProducts } from '@/lib/supabase';
import ShopClient from './ShopClient';

export const revalidate = 60;

export const metadata = {
  title: 'All Objects — Handmade Ceramics, Brass & Artisan Home Decor',
  description:
    'Browse the full archive of handcrafted objects: handmade ceramics, brass decor, marble, letterpress stationery and unique home decor from 18 countries. Filter by country, collection and price.',
};

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopClient products={products} />;
}
