# The Nomad — SEO implementation report

**Site:** https://www.thenomad.buzz
**Branch:** `seo/technical-upgrade` → merged to `main`
**Commit:** `25ebb2c12d08fc801421eb24e586076876617450`
**Deployed:** production, verified from rendered HTML
**Baseline audit:** [`SEO-AUDIT.md`](./SEO-AUDIT.md) (pre-change state, commit `b008b1a`)

---

## 1. Before and after

Both columns come from the same crawler run over the same 102 URLs — 87 from the sitemap plus
utility, parameter and invalid-slug probes. "Before" was measured against production on commit
`b008b1a`; "after" against production on `25ebb2c`.

| Measure | Before | After |
|---|---|---|
| URLs with a canonical tag | **0** | **92 / 92** (every 200 that should have one) |
| Indexable pages missing a canonical | 91 | **0** |
| `<html lang>` | `en` | `en-IN` |
| Distinct schema types across the site | 3 (`Product`, `Brand`, `Offer`) | **20** |
| Pages carrying any structured data | 42 | **98** |
| Pages with `BreadcrumbList` | 0 | **79** |
| Pages with `og:url` | 0 | **92** |
| Titles over the display limit | 58 | **0** |
| Descriptions outside 70–165 characters | 55 | **0** |
| Sitemap URLs | 84 | **87** |
| Sitemap entries with `lastmod` | 0 | **75** (the 12 without have no genuine timestamp) |
| `robots.txt` paths blocked that also send `noindex` | 8 | **0** |
| Duplicate host serving 200 | `the-nomad-store.vercel.app` | **308 → www.thenomad.buzz** |
| Genuine 404 on invalid slugs | yes | yes (unchanged) |

## 2. Problems found, and what happened to each

| # | Problem | Resolution |
|---|---|---|
| 1 | No canonical tag on any of 99 URLs | Self-referencing canonical + `og:url` on every route |
| 2 | `the-nomad-store.vercel.app` served a full duplicate at 200 | Host-matched 308 in `next.config.mjs`; preview URLs untouched |
| 3 | `?utm_source=`, `?country=`, `?sort=` and `/shop/` were indexable duplicates | All now canonicalise to the clean URL |
| 4 | Structured data on one template only | `OnlineStore`, `WebSite`, `BreadcrumbList`, `CollectionPage`, `ItemList`, `BlogPosting`, `Blog`, `FAQPage` added |
| 5 | `Product` schema missing merchant-eligibility fields | `url`, `material`, `category`, `countryOfOrigin`, `itemCondition`, `seller`, `shippingDetails`, `hasMerchantReturnPolicy` added — all transcribed from the site's own visible policies |
| 6 | Sitemap had no `lastmod` | Real `created_at` timestamps; pages with no genuine date carry none |
| 7 | `robots.txt` blocked eight `noindex` paths | Disallow reduced to `/api/` so the directives can be read |
| 8 | `lang="en"` on an INR, India-only shop | `en-IN` |
| 9 | Country descriptions were a 300-char slice cut mid-sentence (18 pages) | Composed from the object count plus the country's own copy, trimmed on a sentence boundary |
| 10 | Journal descriptions were 51–67 characters (9 pages) | Excerpt extended with country and read time, both real fields |
| 11 | All nine `/gifts` tiles linked to `/shop`; four quoted invented counts | Every tile is a real destination with a counted figure |
| 12 | `/country/t-rkiye` — a slug helper dropped the `ü` to a hyphen | Diacritic-safe slug → `/country/turkiye`; old URL 308s |
| 13 | 973 images with no dimensions, no `srcset` | Product cards carry `srcset`, `sizes` and intrinsic dimensions; heroes get `fetchPriority` |
| 14 | `lib/site.js` fell back to the vercel.app host | Falls back to the live domain, so a missing env var can no longer split the site |
| 15 | Product page skipped `h1 → h3`; homepage drop panel had an unclosed `h3` | Heading order corrected; the stray tag was a real HTML bug |

## 3. Files changed

**New**

| File | What it does |
|---|---|
| `lib/seo.js` | Canonical helper, title fitting, and every JSON-LD builder |
| `lib/giftGuides.js` | The three gift guides, as filters over the real product table |
| `lib/related.js` | The article ↔ country map, shared by product, country and article pages |
| `components/JsonLd.js` | Renders JSON-LD with `<` escaped so a string can never close the tag |
| `app/gifts/[guide]/page.js` | The gift guide template |
| `docs/SEO-AUDIT.md`, `docs/SEO-IMPLEMENTATION-REPORT.md` | This work |

**Modified** — `app/layout.js`, `app/page.js`, `app/robots.js`, `app/sitemap.js`, `app/shop/page.js`,
`app/gifts/page.js`, `app/journal/page.js`, `app/journal/[slug]/page.js`,
`app/product/[slug]/page.js`, `app/country/[slug]/page.js`, `app/faqs/page.js`, plus the nine other
static routes for canonicals and description tuning; `components/ProductCard.js`, `lib/format.js`,
`lib/site.js`, `next.config.mjs`.

32 files, +1,346 / −247.

## 4. Keyword-to-page map

One principal intent per indexable page. Nothing competes with anything else.

| Page | Principal intent | Supporting terms |
|---|---|---|
| `/` | handcrafted home decor India | artisan home decor, collectibles, travel gifts |
| `/shop` | handmade ceramics India, artisan home decor | brass decor, marble, letterpress stationery |
| `/gifts` | unique gifts India / gifts for people who have everything | premium gifts under ₹5,000 |
| `/gifts/under-1500` | gifts under ₹1,500 | handcrafted gifts, small gifts India |
| `/gifts/under-3000` | gifts under ₹3,000 | artisan gifts, handmade ceramics gift |
| `/gifts/housewarming` | unique housewarming gifts | new home gifts, table and home objects |
| `/country/japan` | Japanese ceramics India | Japanese homeware, Kyoto ceramics |
| `/country/turkiye` | Turkish brass and copper India | hammered brass, copper cezve |
| `/country/morocco` | Moroccan brass decor India | Marrakech brass, hand-chased brass |
| `/country/portugal` | Portuguese ceramics India | azulejo tile, cork, Lisbon |
| …and 14 more country pages | `<country>` handcrafted objects | city and material terms from real inventory |
| `/product/*` (42) | `<object name>` + city + country | material, price, provenance |
| `/journal` | craft stories, city guides | Kyoto, Lisbon, Seoul, Istanbul, Marrakech |
| `/journal/*` (9) | the article's own subject | linked to its country page and objects |
| `/drops` | limited handcrafted drops | Nomad drop, one trip released at once |
| `/world` | where handcrafted objects come from | 29 cities, 18 countries |
| `/about` | who The Nomad is | founder, sourcing, provenance |
| `/voices` | customer letters | social proof |
| `/faqs` | care and buying questions | unlacquered brass care, terracotta, lacquerware |
| `/shipping`, `/returns`, `/contact`, `/terms`, `/privacy` | transactional trust | — |

### Pages deliberately **not** built

Judged against the real inventory, not against the keyword list:

- **Material pages** — 40 distinct materials across 42 objects. Almost every page would be about one product.
- **City pages** — 21 of 29 cities have exactly one object; only Seoul and Istanbul reach three.
- **`/gifts/under-5000`** — that filter returns all 42 objects. It would duplicate `/shop` and `/gifts`, so `/gifts` carries the "under ₹5,000" intent instead (it is the shop's standing promise).
- **Category pages** (`/desk`, `/stationery`) — would duplicate the existing `/shop` filters without adding editorial value at this catalogue size.

All four become worth revisiting when the catalogue grows; see §9.

## 5. Structured-data coverage

| Type | Where | Count |
|---|---|---|
| `OnlineStore` | root layout, every page | 99 |
| `WebSite` | root layout, every page | 99 |
| `BreadcrumbList` | product, country, journal article, gift guides, listings | 79 |
| `Product` + `Offer` + `Brand` | product pages | 42 |
| `OfferShippingDetails` + `MerchantReturnPolicy` | product pages | 42 |
| `CollectionPage` + `ItemList` | `/shop`, `/gifts`, 18 country pages, 3 gift guides | 26 |
| `BlogPosting` | 9 journal articles + the listing | 10 |
| `Blog` | `/journal` | 1 |
| `FAQPage` (12 questions) | `/faqs` | 1 |

**What was deliberately left out, and why**

- **`aggregateRating` / `review`** — no reviews are displayed on any product page. Marking them up would be fabrication and a manual-action risk.
- **`gtin` / `mpn`** — the shop has neither. `sku` uses the real object number (`JP-KYO-011`).
- **`depth`/`width`/`height`** — the spec table shows "12 cm × 7 cm" on all 42 objects, so it is not per-object truth and is not in the markup.
- **`priceValidUntil`** — nothing records an expiry.

Shipping and return values are transcribed from `/shipping` and `/returns`: free over ₹2,500 and ₹150 below it, 2–3 working days handling, 2–8 days transit, India only; 14-day window, return by mail, customer pays return postage, full refund. **If either page changes, `lib/seo.js` must change with it.**

## 6. Performance

Lighthouse, same machine, same build pipeline, before = commit `b008b1a`, after = `25ebb2c`.

| Page | Mobile perf | Mobile LCP | Desktop perf | SEO | Accessibility |
|---|---|---|---|---|---|
| `/` | 93 → **94** | 2.9 s → **2.6 s** | 99 → 98 | 100 → **100** | 96 → **96** |
| `/shop` | 85 → **94** | 3.9 s → **3.1 s** | 100 → 99 | 100 → **100** | 95 → **95** |
| `/product/*` | 95 → **95** | 2.6 s → 2.8 s | 100 → **100** | 100 → **100** | 94 → **96** |
| `/gifts/under-1500` | — (new) | — | **100** | **100** | **96** |
| `/journal/*` | — | — | **100** | **100** | **96** |

CLS is 0.000–0.001 before and after. The `/shop` mobile gain comes from the card `srcset`: a phone now
fetches 320px negatives instead of 500px ones, 42 times over. The product-page LCP moved 0.2 s the
wrong way, which is inside run-to-run variance on this hardware and is not treated as a real change.

Two console errors appear in the Lighthouse runs — Cloudinary and MapTiler requests failing with
`ERR_CONNECTION_RESET`. That is the sandbox this audit ran in blocking outbound image hosts, not the
site; both load correctly in a browser.

## 7. Tests and build

| Check | Result |
|---|---|
| `npx next build` | ✅ passes, zero errors or warnings |
| Lint / typecheck / unit tests | none configured in `package.json` — the repo has `dev`, `build`, `start` only |
| All 87 sitemap URLs return 200 | ✅ |
| Sitemap is well-formed XML | ✅ parsed |
| Every sitemap URL is canonical and indexable | ✅ |
| Every indexable page has a unique title, description and canonical | ✅ |
| No product or journal page is accidentally `noindex` | ✅ |
| Utility routes still `noindex` | ✅ `/checkout`, `/account`, `/signin`, `/admin`, `/saved`, `/order-lookup`, `/unsubscribe` |
| `robots.txt` references the right sitemap | ✅ |
| Product JSON-LD matches the visible price and stock | ✅ ₹3,490 / InStock on `kyoto-matcha-bowl` |
| JSON-LD parses on every page | ✅ no parse errors in 102 crawled URLs |
| Internal links resolve | ✅ 96 distinct targets, zero 404s |
| Invalid product / article / country / guide slugs 404 | ✅ all four |
| Checkout, bag, saved, search, account, admin | ✅ untouched — no file under `app/checkout`, `app/account`, `app/order*`, `app/admin` or the bag/search components was modified |
| Mobile and desktop layout | ✅ no visual change; only heading tags and image attributes moved |

## 8. Deployment

| | |
|---|---|
| Branch | `seo/technical-upgrade` |
| Commit | `25ebb2c12d08fc801421eb24e586076876617450` |
| Preview | `https://the-nomad-store-f9evdaden-framemagazine.vercel.app` — built successfully; the URL sits behind Vercel deployment protection, so it was not crawlable from here. The identical commit was verified against a local production build first. |
| Production | `https://www.thenomad.buzz` — fast-forwarded `main` to the reviewed commit so production runs the exact tree the preview built |
| Verified in production | canonicals, `og:url`, `lang`, all 20 schema types, sitemap, robots, the `t-rkiye` and vercel.app redirects, and a real 404 |

No second Vercel project was created. No secrets were added or moved.

## 9. Still needing the owner, and Phase 2

**Search Console — these need your account**

1. The property for `https://www.thenomad.buzz` is already verified and the token in `app/layout.js` was preserved. Nothing to redo.
2. Resubmit `https://www.thenomad.buzz/sitemap.xml` under **Indexing → Sitemaps**. It previously read "Couldn't fetch"; the file is valid and returns 200, and 3 new URLs plus 75 `lastmod` dates have been added, so a resubmit is worth it.
3. **URL Inspection → Request indexing** for, in order: `/`, `/shop`, `/gifts`, `/gifts/under-1500`, `/gifts/housewarming`, one product (`/product/kyoto-matcha-bowl`) and one article (`/journal/48-hours-in-kyoto`).
4. Watch **Page Indexing** for `Duplicate without user-selected canonical` to clear as the vercel.app duplicate drops out.
5. **Merchant Listings** and **Product Snippets** should start reporting within a week or two now that shipping and return policy are in the markup. Expect a warning about missing `gtin` — that is correct and cannot be fixed without real barcodes.
6. **Core Web Vitals** needs 28 days of field data before it says anything.
7. **Merchant Center** — only worth connecting if you want Shopping surfaces. The product data is complete enough except for GTINs, which Google waives for handmade goods when `identifier_exists` is set to false.

**Decisions I did not make for you**

- **Colour contrast.** The faint label colour `#B4B0A6` on white is about 2.1:1 — below WCAG AA, and the only thing keeping accessibility off 100. Fixing it means darkening that token to roughly `#767068`, which changes the look of every kicker and caption on the site. That is a design decision, not a technical one.
- **The "Found this week" list on the homepage** names four objects that are not in the catalogue. It is presentational, not structured data, so it carries no schema risk — but it is invented inventory on a commercial page.
- **The product spec table** shows "Dimensions 12 cm × 7 cm", "Made by Independent artisan studio" and "Discovered Spring 2026" identically on all 42 objects. None of it is in the structured data. Real per-object values would be worth adding to the admin panel.

**Phase 2, in rough priority order**

1. Per-object dimensions and maker names in the database, then into `Product` schema.
2. An image sitemap — Next 14.2's sitemap route drops an `images` key silently, so this needs a hand-written XML route.
3. `generateStaticParams` on `/product/[slug]`, `/country/[slug]` and `/journal/[slug]` so the 69 dynamic pages are prebuilt rather than rendered on first request.
4. `app/layout.js` fetches all 42 products on every page render to feed the search overlay. Moving that to a static JSON payload would take work off every request on the site.
5. Genuine customer reviews on product pages — then, and only then, `AggregateRating`.
6. Revisit material, city and category pages once any single material, city or category has enough objects to justify a page.
