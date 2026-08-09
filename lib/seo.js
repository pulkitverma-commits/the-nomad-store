// One place for canonicals, social cards and JSON-LD.
//
// Before this file the site had good hand-written titles and descriptions and
// nothing else: no canonical on any of 99 crawled URLs, no og:url, and
// structured data on exactly one template. The helpers here are deliberately
// small — they set the mechanical parts and leave the words to each page.
//
// Everything is server-side. None of it ships to the browser.

import { SITE_URL } from '@/lib/site';
import { inr, productImg, productPublicId, cld } from '@/lib/format';

export const ORG_ID = `${SITE_URL}/#organisation`;
export const SITE_ID = `${SITE_URL}/#website`;

/** Absolute URL from a site-root path. Accepts a already-absolute URL unchanged. */
export function abs(path = '/') {
  if (!path) return SITE_URL;
  if (/^https?:\/\//.test(path)) return path;
  return SITE_URL + (path.startsWith('/') ? path : `/${path}`);
}

// The root layout appends " · The Nomad" to every page title. That is twelve
// characters, and on a long product or country title it pushed the result past
// what Google will show — 58 of the site's titles ran over. `fitTitle` keeps
// the suffix when there is room for it and returns an absolute title when
// there is not, so the informative half survives instead of the brand.
const BRAND_SUFFIX = ' · The Nomad';
const TITLE_BUDGET = 60;

export function fitTitle(text) {
  const t = String(text || '').trim();
  return t.length + BRAND_SUFFIX.length <= TITLE_BUDGET ? t : { absolute: t };
}

// ── JSON-LD ────────────────────────────────────────────────────────────────
//
// `</script>` inside a JSON string would close the tag early, so the one
// character that can break out is escaped. React escapes text nodes but this
// goes in through dangerouslySetInnerHTML, which does not.
export function ldJson(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** The shop itself. Emitted once, in the root layout, and referenced by @id elsewhere. */
export function organisationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': ORG_ID,
    name: 'The Nomad',
    alternateName: 'The Nomad Store',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    image: `${SITE_URL}/opengraph-image`,
    description:
      'Handcrafted collectibles, home decor and travel gifts bought directly from workshops across 18 countries and brought home to India.',
    email: 'hype@thenomad.buzz',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New Delhi',
      addressCountry: 'IN',
    },
    areaServed: { '@type': 'Country', name: 'India' },
    currenciesAccepted: 'INR',
  };
}

/** The site, with the on-site search box people actually use (the ⌘K overlay). */
export function webSiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: 'The Nomad',
    inLanguage: 'en-IN',
    publisher: { '@id': ORG_ID },
  };
}

/** items: [{ name, path }] — the last one is the current page. */
export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

// The two policies below are stated in plain English on /shipping and
// /returns. They are transcribed here, not invented — if either page changes,
// this has to change with it.
const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'IN',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  refundType: 'https://schema.org/FullRefund',
  merchantReturnLink: `${SITE_URL}/returns`,
};

// Free over ₹2,500, ₹150 flat below it. Dispatch 2–3 working days, then 2–8
// on the road. India only — the FAQ says so outright.
function shippingLd(price) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: price >= 2500 ? 0 : 150,
      currency: 'INR',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'IN',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 3, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 8, unitCode: 'DAY' },
    },
  };
}

/**
 * Product schema built only from columns that exist on the row.
 *
 * Deliberately absent: aggregateRating and review (no reviews are displayed on
 * a product page), gtin/mpn (the shop has neither), and the "12 cm × 7 cm"
 * dimensions shown in the spec table — that string is the same on all 42
 * products and is not per-object truth, so it stays out of the markup.
 */
export function productLd(p) {
  const url = abs(`/product/${p.slug}`);
  const images = [productImg(p, 1200), cld(productPublicId(p), 800)].filter(
    (v, i, a) => v && a.indexOf(v) === i
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.name,
    url,
    description: p.description,
    image: images,
    // The shop's own object number — its only real identifier.
    sku: String(p.object_no || '').replace(/^Object\s*#\s*/i, '') || undefined,
    material: p.material || undefined,
    category: p.category || undefined,
    countryOfOrigin: p.country ? { '@type': 'Country', name: p.country } : undefined,
    brand: { '@type': 'Brand', name: 'The Nomad' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORG_ID },
      shippingDetails: shippingLd(p.price),
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
  };
}

/** A listing page's products, in the order they are shown. */
export function itemListLd(products, { path, name }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${abs(path)}#collection`,
    url: abs(path),
    name,
    isPartOf: { '@id': SITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(`/product/${p.slug}`),
        name: p.name,
      })),
    },
  };
}

export function articleLd(a, { url, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: a.title,
    description: a.excerpt,
    image,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en-IN',
    // created_at is the only genuine timestamp on the row. No modified date is
    // claimed, because nothing records one.
    datePublished: a.created_at || undefined,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
  };
}

export function faqLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** The description every product page shares, trimmed to a length a result will show. */
export function productMetaDescription(p) {
  const price = inr(p.price);
  const base = `${p.material}, ${price}. ${p.description}`;
  return trimTo(`${base} Found in ${p.city}, ${p.country} and brought home to India.`, 158);
}

/**
 * Cuts a description to a length search engines will actually show, on a word
 * boundary, without leaving a dangling comma or half a sentence.
 */
export function trimTo(text, max = 158) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' — '));
  if (stop > max * 0.6) return cut.slice(0, stop + 1).trim();
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—-]$/, '').trim() + '…';
}
