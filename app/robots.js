export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/checkout', '/order/', '/order-lookup', '/admin', '/saved', '/unsubscribe'] },
    sitemap: 'https://the-nomad-store.vercel.app/sitemap.xml',
  };
}
