import { getProducts } from '@/lib/supabase';
import SavedClient from './SavedClient';

export const revalidate = 60;

export const metadata = {
  title: 'Saved Objects',
  description:
    'The objects you have set aside. Saved on this device only — nothing is sent to us and no account is required.',
  alternates: { canonical: '/saved' },
  openGraph: { url: '/saved', type: 'website', siteName: 'The Nomad' },
  robots: { index: false, follow: true },
};

export default async function SavedPage() {
  let products = [];
  try {
    products = await getProducts();
  } catch (e) {}
  const list = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    city: p.city,
    country: p.country,
    material: p.material,
    price: p.price,
    stock: p.stock,
    tone: p.tone,
    pop: p.pop,
    photo_id: p.photo_id,
    image_public_id: p.image_public_id,
  }));
  return <SavedClient products={list} />;
}
