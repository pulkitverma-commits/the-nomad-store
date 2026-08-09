import { SITE_URL } from '@/lib/site';

/**
 * robots.txt
 *
 * This used to disallow /checkout, /order/, /order-lookup, /admin, /account,
 * /signin, /saved and /unsubscribe. Every one of those pages already sends
 * `noindex` in its metadata — and a path blocked here can never be fetched, so
 * the noindex on it can never be read. Blocking and noindexing the same URL is
 * the one combination that reliably keeps a page in the index as a bare title.
 *
 * So the disallow list is now only the things that are genuinely not pages:
 * Next's internal asset route and the API surface. Everything else is left
 * crawlable precisely so the noindex directive is honoured. CSS, JavaScript,
 * images and every public page stay open, which Google needs in order to
 * render the site the way a browser does.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
