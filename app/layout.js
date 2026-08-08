import { Instrument_Sans, Cormorant_Garamond } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { UiProvider } from '@/components/Ui';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BagDrawer from '@/components/BagDrawer';
import SearchOverlay from '@/components/SearchOverlay';
import { getProducts } from '@/lib/supabase';

const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
});
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const metadata = {
  metadataBase: new URL('https://the-nomad-store.vercel.app'),
  title: {
    default: 'The Nomad — Handcrafted Home Decor & Travel Gifts from 18 Countries',
    template: '%s · The Nomad',
  },
  description:
    'Unique handcrafted gifts and artisan home decor, discovered on collection trips across 18 countries and brought home to India. Handmade ceramics, brass, marble and letterpress — every object with its own passport.',
  keywords: [
    'handcrafted home decor',
    'artisan home decor',
    'unique gifts india',
    'handmade ceramics',
    'travel gifts',
    'handcrafted gifts',
    'brass decor india',
    'japanese homeware',
  ],
  openGraph: {
    title: 'The Nomad — Objects Worth Bringing Home',
    description:
      'A collection of remarkable handcrafted objects discovered across cities, cultures and corners of the world — brought home to India.',
    type: 'website',
    siteName: 'The Nomad',
  },
  // The card picture itself comes from the opengraph-image / twitter-image file
  // conventions, so only the card shape and its words are set here.
  twitter: {
    card: 'summary_large_image',
    title: 'The Nomad — Objects Worth Bringing Home',
    description:
      'A collection of remarkable handcrafted objects discovered across cities, cultures and corners of the world — brought home to India.',
  },
};

export const revalidate = 60;

export default async function RootLayout({ children }) {
  let products = [];
  try {
    products = await getProducts();
  } catch (e) {}
  const searchProducts = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    city: p.city,
    country: p.country,
    material: p.material,
    category: p.category,
    price: p.price,
    tone: p.tone,
    photo_id: p.photo_id,
    image_public_id: p.image_public_id,
  }));
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        <UiProvider>
          <Header />
          {children}
          <Footer />
          <BagDrawer />
          <SearchOverlay products={searchProducts} />
        </UiProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
