import { SITE_URL } from '@/lib/site';
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/checkout',
        '/order/',
        '/order-lookup',
        '/admin',
        '/account',
        '/signin',
        '/saved',
        '/unsubscribe',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
