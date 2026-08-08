export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/checkout', '/order/', '/admin'] },
    sitemap: 'https://the-nomad-store.vercel.app/sitemap.xml',
  };
}
