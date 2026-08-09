// Which journal article belongs to which country.
//
// This map used to live inside app/journal/[slug]/page.js, where only the
// article page could see it. Product and country pages want the same link in
// the other direction — "the story behind this place" — so it moved here and
// both directions are derived from one list.
export const ARTICLE_COUNTRY = {
  '48-hours-in-kyoto': 'Japan',
  'what-we-brought-home-from-lisbon': 'Portugal',
  'inside-seoul-s-independent-design-stores': 'South Korea',
  'a-morning-at-istanbul-s-grand-bazaar': 'Türkiye',
  'objects-that-define-japanese-design': 'Japan',
  'why-portuguese-ceramics-look-different': 'Portugal',
  '10-things-we-found-in-amsterdam': 'Netherlands',
  'the-story-behind-moroccan-brasswork': 'Morocco',
  'a-guide-to-tokyo-stationery': 'Japan',
};

/** Every article slug written about a country, most recent first in table order. */
export function articleSlugsForCountry(country) {
  return Object.keys(ARTICLE_COUNTRY).filter((slug) => ARTICLE_COUNTRY[slug] === country);
}

/** The first article about a country, resolved against the real article list. */
export function articleForCountry(articles, country) {
  const slugs = articleSlugsForCountry(country);
  if (!slugs.length) return null;
  return articles.find((a) => slugs.includes(a.slug)) || null;
}
