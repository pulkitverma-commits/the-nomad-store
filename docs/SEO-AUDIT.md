# The Nomad — Technical SEO audit

**Site:** https://www.thenomad.buzz · **Stack:** Next.js 14.2.32, App Router, plain JavaScript, Supabase Postgres, Cloudinary images, Vercel
**Crawled:** 99 URLs (84 from `/sitemap.xml`, plus 15 utility, parameter and invalid-slug probes)
**Audit date:** 8 August 2026 · **Baseline commit:** `b008b1a`

This is the pre-implementation state. What was changed and what it looks like afterwards is in
[`SEO-IMPLEMENTATION-REPORT.md`](./SEO-IMPLEMENTATION-REPORT.md).

---

## 1. Headline findings

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 1 | **No canonical tag anywhere on the site.** 0 of 99 crawled URLs emit `<link rel="canonical">`. | High | Every row in §5 |
| 2 | **A second production host serves the whole site.** `https://the-nomad-store.vercel.app/` returns 200 with identical content — a full duplicate of every page. | High | `curl -I` returns `200`, not a redirect |
| 3 | **Query-string variants are indexable duplicates.** `/shop?country=Japan`, `/shop?sort=price` and `/?utm_source=test` all return 200 with the same title, description and body as the clean URL and nothing pointing back to it. | High | §5 rows |
| 4 | **Structured data covers one template.** `Product` + `Brand` + `Offer` on 42 product pages. No `Organization`, `WebSite`, `BreadcrumbList`, `Article`, `ItemList` or `FAQPage` anywhere. | High | `ld_types` column |
| 5 | **`Product` schema is missing every merchant-eligibility property.** No `url`, `material`, `countryOfOrigin`, `itemCondition`, `seller`, `hasMerchantReturnPolicy` or `shippingDetails` — all of which the site states in plain text on `/shipping` and `/returns`. | High | Live JSON-LD on `/product/kyoto-matcha-bowl` |
| 6 | **Sitemap has no `lastModified` on any of its 84 entries.** | Medium | `/sitemap.xml` |
| 7 | **`robots.txt` blocks eight paths that also carry `noindex`.** Blocking a URL in `robots.txt` stops crawlers reading the `noindex` on it, which is the opposite of the intent. | Medium | `app/robots.js` vs the `robots` column |
| 8 | **`lang="en"`, not `en-IN`.** The entire catalogue is priced in INR and ships only within India. | Medium | `<html lang>` on 96 pages |
| 9 | **Country page descriptions are a 300-character slice of body copy**, truncated mid-sentence, on all 18 country pages. | Medium | §5, `desc len = 300` |
| 10 | **Journal descriptions are 51–67 characters** — the raw excerpt, well under the useful range. | Medium | §5 |
| 11 | **All nine `/gifts` tiles link to `/shop`**, and four of them display invented counts ("Gifts for designers · 11 objects", "Housewarming · 14 objects") that are not derived from any data. | Medium | `app/gifts/page.js` lines 15–25 |
| 12 | **973 images render with no `width`/`height`.** Most sit inside `aspect-ratio` wrappers so measured CLS is low, but nothing guarantees it and no image uses `next/image` or a `srcset`. | Medium | `imgs_no_dims` |
| 13 | **`/country/t-rkiye`** — the slug helper strips the `ü` from "Türkiye" to a hyphen, producing a meaningless URL that is live and in the sitemap. | Medium | `lib/format.js:87` |
| 14 | **`/shop` (105 KB) and `/` (116 KB) initial HTML.** `app/layout.js` fetches all 42 products on *every* page render to feed the search overlay. | Low | Page weight column |
| 15 | No `og:url` on any page; product/article social images are correct otherwise. | Low | §5 |

### What is already correct — and was left alone

- Every public route has a hand-written, non-templated title and description. These are good and were preserved wherever they were already within range.
- `http → https` and apex `→ www` both redirect (308).
- Trailing slash normalises: `/shop/` → `/shop` (308, one hop).
- Invalid product, article and country slugs return a **genuine 404**, not a soft 404. All four probes returned `404` with `noindex, nofollow`.
- Utility routes (`/checkout`, `/account`, `/signin`, `/admin`, `/order-lookup`, `/unsubscribe`, `/saved`) already carry correct `noindex` directives.
- Google Search Console verification token is present in `app/layout.js` and must be preserved.
- Product listing content is server-rendered even inside the `'use client'` shop grid — it is in the initial HTML.
- Every one of the 973 images has an `alt` attribute; 392 are deliberately empty on decorative artwork, which is correct.
- Vercel Analytics and Speed Insights are already installed and mounted.

---

## 2. Orphans, broken links and crawl traps

- **No orphaned products or articles.** All 42 products are linked from `/shop`, their country page and at least one "you may also discover" block; all 9 articles are linked from `/journal`.
- **No broken internal links.** Every internal `href` found in the crawl resolved to a 200 (or to a deliberate `noindex` utility page).
- **No redirect chains inside the site.** The only multi-hop path is `http://thenomad.buzz` → `https://thenomad.buzz` → `https://www.thenomad.buzz` (2 hops, host level, unavoidable without an HSTS-preload-style flattening at the registrar).
- **No soft 404s.**
- **No crawl traps.** The shop filters are React state only — they never write to the URL — so the site itself generates no parameter URLs. The exposure is external links (`utm_*`, `fbclid`) landing on indexable duplicates, which is what canonicals fix.

## 3. Content and inventory reality check

Counted from Supabase, not assumed:

- **42 products** across **18 countries** and **29 cities**.
- **40 distinct materials** for 42 products — i.e. materials are effectively unique per object. **Material landing pages are not justified** and were not built.
- **City distribution:** only Seoul and Istanbul reach 3 products; 21 of 29 cities have exactly 1. **City pages are not justified** and were not built.
- **Country distribution:** Japan 6, Portugal 4, then Türkiye / Morocco / Italy / France / South Korea at 3, and five countries with a single object. The 18 country pages already exist and carry unique editorial copy from the `countries` table, so they were kept and improved rather than pruned.
- **Price:** ₹1,500 and under = 10 objects; ₹3,000 and under = 32; ₹5,000 and under = 42 (the whole catalogue, matching the "nothing over ₹5,000" promise).
- **Categories:** Table 15, Home 10, Desk 8, Stationery 5, Art 2, Objects 1, Vintage 1.
- **9 journal articles**, each with `created_at`, an excerpt, a cover image and photographer credit.

## 4. Performance baseline

| Page | Initial HTML | Notes |
|---|---|---|
| `/` | 116.0 KB | Hero photograph + 7 sticker PNGs + postcard stack, none with dimensions |
| `/shop` | 105.2 KB | 42 product cards in one grid, all images eager |
| `/product/*` | ~60 KB | Main image, detail crop, 9 MapTiler raster tiles, 4 related cards |
| `/world` | ~345 KB JS | MapLibre GL — the heaviest client bundle on the site |

---

## 5. Full crawl inventory

| URL | Status | Indexable | Canonical | Title (len) | Desc len | H1 | Robots | Schema | Int. links | Imgs (no alt / no dims) | In sitemap | Type | Problem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | yes | **none** | The Nomad — Handcrafted Home Decor & Travel Gifts fr (67) | 194 | Collectibles WorthBringing Home | — | — | 59 | 0 / 31 | yes | Home | no canonical; title 67c; desc 194c; no JSON-LD; 31 imgs w/o dims |
| `/shop` | 200 | yes | **none** | All Objects — Handmade Ceramics, Brass & Artisan Hom (71) | 192 | All Objects | — | — | 68 | 0 / 42 | yes | Static | no canonical; title 71c; desc 192c; no JSON-LD; 42 imgs w/o dims |
| `/gifts` | 200 | yes | **none** | Unique Handcrafted Gifts from Around the World · The (58) | 168 | For people who have everything | — | — | 39 | 0 / 4 | yes | Static | no canonical; desc 168c; no JSON-LD; 4 imgs w/o dims |
| `/drops` | 200 | yes | **none** | Nomad Drops — One Trip, Released All at Once · The N (56) | 163 | We release what we find, all at on | — | — | 26 | 0 / 0 | yes | Static | no canonical; no JSON-LD |
| `/journal` | 200 | yes | **none** | Journal — Notes from the Places Our Objects Come Fro (65) | 131 | Notes from the places our objects  | — | — | 35 | 0 / 9 | yes | Static | no canonical; title 65c; no JSON-LD; 9 imgs w/o dims |
| `/world` | 200 | yes | **none** | World Map — Everywhere We Have Been · The Nomad (47) | 173 | Everywhere we have been | — | — | 44 | 0 / 0 | yes | Static | no canonical; desc 173c; no JSON-LD |
| `/about` | 200 | yes | **none** | About — a shop that started as a suitcase · The Noma (53) | 125 | A shop that started as a suitcase | — | — | 26 | 0 / 1 | yes | Static | no canonical; no JSON-LD; 1 imgs w/o dims |
| `/voices` | 200 | yes | **none** | Voices — what people wrote back · The Nomad (43) | 115 | What people wrote back | — | — | 28 | 0 / 0 | yes | Static | no canonical; no JSON-LD |
| `/soon` | 200 | yes | **none** | Coming Home Soon — Objects in Transit · The Nomad (49) | 170 | Coming Home Soon | — | — | 26 | 0 / 6 | yes | Static | no canonical; desc 170c; no JSON-LD; 6 imgs w/o dims |
| `/shipping` | 200 | yes | **none** | Shipping · The Nomad (20) | 161 | Shipping | — | — | 32 | 0 / 0 | yes | Static | no canonical; title 20c thin; no JSON-LD |
| `/returns` | 200 | yes | **none** | Returns · The Nomad (19) | 206 | Returns | — | — | 32 | 0 / 0 | yes | Static | no canonical; title 19c thin; desc 206c; no JSON-LD |
| `/contact` | 200 | yes | **none** | Contact · The Nomad (19) | 164 | Contact | — | — | 33 | 0 / 0 | yes | Static | no canonical; title 19c thin; no JSON-LD |
| `/faqs` | 200 | yes | **none** | FAQs · The Nomad (16) | 196 | Questions | — | — | 33 | 0 / 0 | yes | Static | no canonical; title 16c thin; desc 196c; no JSON-LD |
| `/terms` | 200 | yes | **none** | Terms · The Nomad (17) | 216 | Terms | — | — | 33 | 0 / 0 | yes | Static | no canonical; title 17c thin; desc 216c; no JSON-LD |
| `/privacy` | 200 | yes | **none** | Privacy · The Nomad (19) | 225 | Privacy | — | — | 32 | 0 / 0 | yes | Static | no canonical; title 19c thin; desc 225c; no JSON-LD |
| `/product/kyoto-matcha-bowl` | 200 | yes | **none** | Kyoto Matcha Bowl — Handcrafted in Kyoto, Japan · Th (59) | 175 | Kyoto Matcha Bowl | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; desc 175c; 15 imgs w/o dims |
| `/product/tokyo-grid-notebook` | 200 | yes | **none** | Tokyo Grid Notebook — Handcrafted in Tokyo, Japan ·  (61) | 179 | Tokyo Grid Notebook | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; desc 179c; 15 imgs w/o dims |
| `/product/osaka-steel-bottle-opener` | 200 | yes | **none** | Osaka Steel Bottle Opener — Handcrafted in Osaka, Ja (67) | 162 | Osaka Steel Bottle Opener | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 67c; 15 imgs w/o dims |
| `/product/kanazawa-cedar-tea-tray` | 200 | yes | **none** | Kanazawa Cedar Tea Tray — Handcrafted in Kanazawa, J (68) | 164 | Kanazawa Cedar Tea Tray | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 68c; 15 imgs w/o dims |
| `/product/nara-cedar-incense-holder` | 200 | yes | **none** | Nara Cedar Incense Holder — Handcrafted in Nara, Jap (66) | 153 | Nara Cedar Incense Holder | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 66c; 15 imgs w/o dims |
| `/product/tokyo-brass-pen` | 200 | yes | **none** | Tokyo Brass Pen — Handcrafted in Tokyo, Japan · The  (57) | 166 | Tokyo Brass Pen | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; desc 166c; 15 imgs w/o dims |
| `/product/lisbon-espresso-cup` | 200 | yes | **none** | Lisbon Espresso Cup — Handcrafted in Lisbon, Portuga (65) | 175 | Lisbon Espresso Cup | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 65c; desc 175c; 15 imgs w/o dims |
| `/product/porto-sardine-plate` | 200 | yes | **none** | Porto Sardine Plate — Handcrafted in Porto, Portugal (64) | 161 | Porto Sardine Plate | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 64c; 15 imgs w/o dims |
| `/product/lisbon-azulejo-tile` | 200 | yes | **none** | Lisbon Azulejo Tile — Handcrafted in Lisbon, Portuga (65) | 172 | Lisbon Azulejo Tile | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 65c; desc 172c; 15 imgs w/o dims |
| `/product/porto-cork-coaster-set` | 200 | yes | **none** | Porto Cork Coaster Set — Handcrafted in Porto, Portu (67) | 158 | Porto Cork Coaster Set | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 67c; 15 imgs w/o dims |
| `/product/seoul-aluminium-tray` | 200 | yes | **none** | Seoul Aluminium Tray — Handcrafted in Seoul, South K (68) | 166 | Seoul Aluminium Tray | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 68c; desc 166c; 15 imgs w/o dims |
| `/product/seoul-hanji-letter-set` | 200 | yes | **none** | Seoul Hanji Letter Set — Handcrafted in Seoul, South (70) | 167 | Seoul Hanji Letter Set | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 70c; desc 167c; 15 imgs w/o dims |
| `/product/seoul-ceramic-vase` | 200 | yes | **none** | Seoul Ceramic Vase — Handcrafted in Seoul, South Kor (66) | 157 | Seoul Ceramic Vase | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 66c; 15 imgs w/o dims |
| `/product/istanbul-brass-dish` | 200 | yes | **none** | Istanbul Brass Dish — Handcrafted in Istanbul, Türki (66) | 169 | Istanbul Brass Dish | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 66c; desc 169c; 15 imgs w/o dims |
| `/product/istanbul-copper-cezve` | 200 | yes | **none** | Istanbul Copper Cezve — Handcrafted in Istanbul, Tür (68) | 171 | Istanbul Copper Cezve | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 68c; desc 171c; 15 imgs w/o dims |
| `/product/istanbul-glass-tea-set` | 200 | yes | **none** | Istanbul Glass Tea Set — Handcrafted in Istanbul, Tü (69) | 163 | Istanbul Glass Tea Set | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 69c; 15 imgs w/o dims |
| `/product/marrakech-incense-holder` | 200 | yes | **none** | Marrakech Incense Holder — Handcrafted in Marrakech, (72) | 173 | Marrakech Incense Holder | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 72c; desc 173c; 15 imgs w/o dims |
| `/product/marrakech-brass-mirror` | 200 | yes | **none** | Marrakech Brass Mirror — Handcrafted in Marrakech, M (70) | 159 | Marrakech Brass Mirror | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 70c; 15 imgs w/o dims |
| `/product/fez-wool-coaster` | 200 | yes | **none** | Fez Wool Coaster — Handcrafted in Fez, Morocco · The (58) | 154 | Fez Wool Coaster | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; 15 imgs w/o dims |
| `/product/amsterdam-bicycle-miniature` | 200 | yes | **none** | Amsterdam Bicycle Miniature — Handcrafted in Amsterd (79) | 166 | Amsterdam Bicycle Miniature | — | Brand, Offer, Product | 29 | 0 / 12 | yes | Product | no canonical; title 79c; desc 166c; 12 imgs w/o dims |
| `/product/amsterdam-delft-vase` | 200 | yes | **none** | Amsterdam Delft Vase — Handcrafted in Amsterdam, Net (72) | 156 | Amsterdam Delft Vase | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 72c; 15 imgs w/o dims |
| `/product/florence-marble-paperweight` | 200 | yes | **none** | Florence Marble Paperweight — Handcrafted in Florenc (72) | 165 | Florence Marble Paperweight | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 72c; 15 imgs w/o dims |
| `/product/milan-steel-bookend` | 200 | yes | **none** | Milan Steel Bookend — Handcrafted in Milan, Italy ·  (61) | 167 | Milan Steel Bookend | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; desc 167c; 15 imgs w/o dims |
| `/product/rome-espresso-spoon-set` | 200 | yes | **none** | Rome Espresso Spoon Set — Handcrafted in Rome, Italy (64) | 162 | Rome Espresso Spoon Set | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 64c; 15 imgs w/o dims |
| `/product/paris-museum-pencil-set` | 200 | yes | **none** | Paris Museum Pencil Set — Handcrafted in Paris, Fran (66) | 167 | Paris Museum Pencil Set | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 66c; desc 167c; 15 imgs w/o dims |
| `/product/provence-olive-wood-board` | 200 | yes | **none** | Provence Olive Wood Board — Handcrafted in Provence, (71) | 168 | Provence Olive Wood Board | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 71c; desc 168c; 15 imgs w/o dims |
| `/product/paris-flea-market-key` | 200 | yes | **none** | Paris Flea Market Key — Handcrafted in Paris, France (64) | 154 | Paris Flea Market Key | — | Brand, Offer, Product | 30 | 0 / 13 | yes | Product | no canonical; title 64c; 13 imgs w/o dims |
| `/product/bali-teak-desk-object` | 200 | yes | **none** | Bali Teak Desk Object — Handcrafted in Bali, Indones (66) | 159 | Bali Teak Desk Object | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 66c; 15 imgs w/o dims |
| `/product/bali-woven-coaster` | 200 | yes | **none** | Bali Woven Coaster — Handcrafted in Bali, Indonesia  (63) | 152 | Bali Woven Coaster | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 63c; 15 imgs w/o dims |
| `/product/oaxaca-painted-miniature` | 200 | yes | **none** | Oaxaca Painted Miniature — Handcrafted in Oaxaca, Me (68) | 168 | Oaxaca Painted Miniature | — | Brand, Offer, Product | 30 | 0 / 13 | yes | Product | no canonical; title 68c; desc 168c; 13 imgs w/o dims |
| `/product/mexico-city-obsidian-dish` | 200 | yes | **none** | Mexico City Obsidian Dish — Handcrafted in Mexico Ci (74) | 164 | Mexico City Obsidian Dish | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 74c; 15 imgs w/o dims |
| `/product/copenhagen-candle-holder` | 200 | yes | **none** | Copenhagen Candle Holder — Handcrafted in Copenhagen (73) | 176 | Copenhagen Candle Holder | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 73c; desc 176c; 15 imgs w/o dims |
| `/product/copenhagen-letter-opener` | 200 | yes | **none** | Copenhagen Letter Opener — Handcrafted in Copenhagen (73) | 158 | Copenhagen Letter Opener | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 73c; 15 imgs w/o dims |
| `/product/bangkok-handmade-basket` | 200 | yes | **none** | Bangkok Handmade Basket — Handcrafted in Bangkok, Th (70) | 157 | Bangkok Handmade Basket | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 70c; 15 imgs w/o dims |
| `/product/chiang-mai-celadon-cup` | 200 | yes | **none** | Chiang Mai Celadon Cup — Handcrafted in Chiang Mai,  (72) | 171 | Chiang Mai Celadon Cup | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 72c; desc 171c; 15 imgs w/o dims |
| `/product/stockholm-ash-desk-tidy` | 200 | yes | **none** | Stockholm Ash Desk Tidy — Handcrafted in Stockholm,  (70) | 155 | Stockholm Ash Desk Tidy | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 70c; 15 imgs w/o dims |
| `/product/zurich-anodised-ruler` | 200 | yes | **none** | Zurich Anodised Ruler — Handcrafted in Zurich, Switz (70) | 169 | Zurich Anodised Ruler | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 70c; desc 169c; 15 imgs w/o dims |
| `/product/zurich-notebook-clip` | 200 | yes | **none** | Zurich Notebook Clip — Handcrafted in Zurich, Switze (69) | 162 | Zurich Notebook Clip | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 69c; 15 imgs w/o dims |
| `/product/barcelona-terracotta-jug` | 200 | yes | **none** | Barcelona Terracotta Jug — Handcrafted in Barcelona, (70) | 164 | Barcelona Terracotta Jug | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 70c; 15 imgs w/o dims |
| `/product/athens-marble-dish` | 200 | yes | **none** | Athens Marble Dish — Handcrafted in Athens, Greece · (62) | 162 | Athens Marble Dish | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; 15 imgs w/o dims |
| `/product/london-letterpress-cards` | 200 | yes | **none** | London Letterpress Cards — Handcrafted in London, Un (76) | 160 | London Letterpress Cards | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 76c; 15 imgs w/o dims |
| `/product/hoi-an-lacquer-bowl` | 200 | yes | **none** | Hoi An Lacquer Bowl — Handcrafted in Hoi An, Vietnam (64) | 166 | Hoi An Lacquer Bowl | — | Brand, Offer, Product | 32 | 0 / 15 | yes | Product | no canonical; title 64c; desc 166c; 15 imgs w/o dims |
| `/country/japan` | 200 | yes | **none** | Japan — Handcrafted Objects & Artisan Home Decor · T (60) | 300 | Japan | — | — | 32 | 0 / 7 | yes | Country | no canonical; desc 300c; no JSON-LD; 7 imgs w/o dims |
| `/country/portugal` | 200 | yes | **none** | Portugal — Handcrafted Objects & Artisan Home Decor  (63) | 300 | Portugal | — | — | 30 | 0 / 5 | yes | Country | no canonical; title 63c; desc 300c; no JSON-LD; 5 imgs w/o dims |
| `/country/south-korea` | 200 | yes | **none** | South Korea — Handcrafted Objects & Artisan Home Dec (66) | 300 | South Korea | — | — | 29 | 0 / 4 | yes | Country | no canonical; title 66c; desc 300c; no JSON-LD; 4 imgs w/o dims |
| `/country/t-rkiye` | 200 | yes | **none** | Türkiye — Handcrafted Objects & Artisan Home Decor · (62) | 300 | Türkiye | — | — | 29 | 0 / 4 | yes | Country | no canonical; desc 300c; no JSON-LD; 4 imgs w/o dims |
| `/country/morocco` | 200 | yes | **none** | Morocco — Handcrafted Objects & Artisan Home Decor · (62) | 300 | Morocco | — | — | 29 | 0 / 4 | yes | Country | no canonical; desc 300c; no JSON-LD; 4 imgs w/o dims |
| `/country/netherlands` | 200 | yes | **none** | Netherlands — Handcrafted Objects & Artisan Home Dec (66) | 300 | Netherlands | — | — | 28 | 0 / 3 | yes | Country | no canonical; title 66c; desc 300c; no JSON-LD; 3 imgs w/o dims |
| `/country/italy` | 200 | yes | **none** | Italy — Handcrafted Objects & Artisan Home Decor · T (60) | 300 | Italy | — | — | 29 | 0 / 4 | yes | Country | no canonical; desc 300c; no JSON-LD; 4 imgs w/o dims |
| `/country/france` | 200 | yes | **none** | France — Handcrafted Objects & Artisan Home Decor ·  (61) | 300 | France | — | — | 29 | 0 / 4 | yes | Country | no canonical; desc 300c; no JSON-LD; 4 imgs w/o dims |
| `/country/indonesia` | 200 | yes | **none** | Indonesia — Handcrafted Objects & Artisan Home Decor (64) | 300 | Indonesia | — | — | 28 | 0 / 3 | yes | Country | no canonical; title 64c; desc 300c; no JSON-LD; 3 imgs w/o dims |
| `/country/mexico` | 200 | yes | **none** | Mexico — Handcrafted Objects & Artisan Home Decor ·  (61) | 300 | Mexico | — | — | 28 | 0 / 3 | yes | Country | no canonical; desc 300c; no JSON-LD; 3 imgs w/o dims |
| `/country/denmark` | 200 | yes | **none** | Denmark — Handcrafted Objects & Artisan Home Decor · (62) | 300 | Denmark | — | — | 28 | 0 / 3 | yes | Country | no canonical; desc 300c; no JSON-LD; 3 imgs w/o dims |
| `/country/thailand` | 200 | yes | **none** | Thailand — Handcrafted Objects & Artisan Home Decor  (63) | 300 | Thailand | — | — | 28 | 0 / 3 | yes | Country | no canonical; title 63c; desc 300c; no JSON-LD; 3 imgs w/o dims |
| `/country/sweden` | 200 | yes | **none** | Sweden — Handcrafted Objects & Artisan Home Decor ·  (61) | 300 | Sweden | — | — | 27 | 0 / 2 | yes | Country | no canonical; desc 300c; no JSON-LD; 2 imgs w/o dims |
| `/country/switzerland` | 200 | yes | **none** | Switzerland — Handcrafted Objects & Artisan Home Dec (66) | 300 | Switzerland | — | — | 28 | 0 / 3 | yes | Country | no canonical; title 66c; desc 300c; no JSON-LD; 3 imgs w/o dims |
| `/country/spain` | 200 | yes | **none** | Spain — Handcrafted Objects & Artisan Home Decor · T (60) | 300 | Spain | — | — | 27 | 0 / 2 | yes | Country | no canonical; desc 300c; no JSON-LD; 2 imgs w/o dims |
| `/country/greece` | 200 | yes | **none** | Greece — Handcrafted Objects & Artisan Home Decor ·  (61) | 300 | Greece | — | — | 27 | 0 / 2 | yes | Country | no canonical; desc 300c; no JSON-LD; 2 imgs w/o dims |
| `/country/united-kingdom` | 200 | yes | **none** | United Kingdom — Handcrafted Objects & Artisan Home  (69) | 300 | United Kingdom | — | — | 27 | 0 / 2 | yes | Country | no canonical; title 69c; desc 300c; no JSON-LD; 2 imgs w/o dims |
| `/country/vietnam` | 200 | yes | **none** | Vietnam — Handcrafted Objects & Artisan Home Decor · (62) | 300 | Vietnam | — | — | 27 | 0 / 2 | yes | Country | no canonical; desc 300c; no JSON-LD; 2 imgs w/o dims |
| `/journal/48-hours-in-kyoto` | 200 | yes | **none** | 48 Hours in Kyoto — The Nomad Journal · The Nomad (49) | 99 | 48 Hours in Kyoto | — | — | 30 | 0 / 5 | yes | Article | no canonical; no JSON-LD; 5 imgs w/o dims |
| `/journal/what-we-brought-home-from-lisbon` | 200 | yes | **none** | What We Brought Home From Lisbon — The Nomad Journal (64) | 61 | What We Brought Home From Lisbon | — | — | 30 | 0 / 5 | yes | Article | no canonical; title 64c; desc 61c thin; no JSON-LD; 5 imgs w/o dims |
| `/journal/inside-seoul-s-independent-design-stores` | 200 | yes | **none** | Inside Seoul’s Independent Design Stores — The Nomad (72) | 67 | Inside Seoul’s Independent Design  | — | — | 29 | 0 / 4 | yes | Article | no canonical; title 72c; desc 67c thin; no JSON-LD; 4 imgs w/o dims |
| `/journal/a-morning-at-istanbul-s-grand-bazaar` | 200 | yes | **none** | A Morning at Istanbul’s Grand Bazaar — The Nomad Jou (68) | 85 | A Morning at Istanbul’s Grand Baza | — | — | 29 | 0 / 4 | yes | Article | no canonical; title 68c; no JSON-LD; 4 imgs w/o dims |
| `/journal/objects-that-define-japanese-design` | 200 | yes | **none** | Objects That Define Japanese Design — The Nomad Jour (67) | 53 | Objects That Define Japanese Desig | — | — | 30 | 0 / 5 | yes | Article | no canonical; title 67c; desc 53c thin; no JSON-LD; 5 imgs w/o dims |
| `/journal/why-portuguese-ceramics-look-different` | 200 | yes | **none** | Why Portuguese Ceramics Look Different — The Nomad J (70) | 65 | Why Portuguese Ceramics Look Diffe | — | — | 30 | 0 / 5 | yes | Article | no canonical; title 70c; desc 65c thin; no JSON-LD; 5 imgs w/o dims |
| `/journal/10-things-we-found-in-amsterdam` | 200 | yes | **none** | 10 Things We Found in Amsterdam — The Nomad Journal  (63) | 64 | 10 Things We Found in Amsterdam | — | — | 28 | 0 / 3 | yes | Article | no canonical; title 63c; desc 64c thin; no JSON-LD; 3 imgs w/o dims |
| `/journal/the-story-behind-moroccan-brasswork` | 200 | yes | **none** | The Story Behind Moroccan Brasswork — The Nomad Jour (67) | 57 | The Story Behind Moroccan Brasswor | — | — | 29 | 0 / 4 | yes | Article | no canonical; title 67c; desc 57c thin; no JSON-LD; 4 imgs w/o dims |
| `/journal/a-guide-to-tokyo-stationery` | 200 | yes | **none** | A Guide to Tokyo Stationery — The Nomad Journal · Th (59) | 51 | A Guide to Tokyo Stationery | — | — | 30 | 0 / 5 | yes | Article | no canonical; desc 51c thin; no JSON-LD; 5 imgs w/o dims |
| `/checkout` | 200 | no | **none** | Checkout · The Nomad (20) | 213 | — | noindex | — | 26 | 0 / 0 | no | Utility | no canonical; title 20c thin; desc 213c; 0 h1; no JSON-LD |
| `/signin` | 200 | no | **none** | Sign in · The Nomad (19) | 104 | — | noindex, nofollow | — | 26 | 0 / 0 | no | Utility | no canonical; title 19c thin; 0 h1; no JSON-LD |
| `/saved` | 200 | no | **none** | Saved Objects · The Nomad (25) | 109 | Saved Objects | noindex, follow | — | 26 | 0 / 0 | no | Utility | no canonical; no JSON-LD |
| `/order-lookup` | 200 | no | **none** | Find an order · The Nomad (25) | 213 | Where is it? | noindex, nofollow | — | 27 | 0 / 0 | no | Utility | no canonical; desc 213c; no JSON-LD |
| `/unsubscribe` | 200 | no | **none** | Unsubscribe · The Nomad (23) | 213 | — | noindex, nofollow | — | 26 | 0 / 0 | no | Utility | no canonical; title 23c thin; desc 213c; 0 h1; no JSON-LD |
| `/admin` | 200 | no | **none** | Admin · The Nomad (17) | 213 | — | noindex, nofollow | — | 26 | 0 / 0 | no | Utility | no canonical; title 17c thin; desc 213c; 0 h1; no JSON-LD |
| `/account` | 200 | no | **none** | Your account · The Nomad (24) | 213 | — | noindex, nofollow | — | 26 | 0 / 0 | no | Utility | no canonical; title 24c thin; desc 213c; 0 h1; no JSON-LD |
| `/no-such-page-xyz` | 404 | no | **none** | Not found · The Nomad (21) | 213 | This one we could not find | noindex, nofollow | — | 31 | 0 / 0 | no | Invalid slug | — |
| `/product/no-such-product-xyz` | 404 | no | **none** | Not found · The Nomad (21) | 213 | — | noindex, nofollow | — | 0 | 0 / 0 | no | Product | — |
| `/journal/no-such-article-xyz` | 404 | no | **none** | Not found · The Nomad (21) | 213 | — | noindex, nofollow | — | 0 | 0 / 0 | no | Article | — |
| `/country/no-such-country-xyz` | 404 | no | **none** | Not found · The Nomad (21) | 213 | — | noindex, nofollow | — | 0 | 0 / 0 | no | Country | — |
| `/shop?country=Japan` | 200 | yes | **none** | All Objects — Handmade Ceramics, Brass & Artisan Hom (71) | 192 | All Objects | — | — | 68 | 0 / 42 | no | Param/variant | no canonical; title 71c; desc 192c; indexable duplicate; no JSON-LD; 42 imgs w/o dims |
| `/shop?sort=price` | 200 | yes | **none** | All Objects — Handmade Ceramics, Brass & Artisan Hom (71) | 192 | All Objects | — | — | 68 | 0 / 42 | no | Param/variant | no canonical; title 71c; desc 192c; indexable duplicate; no JSON-LD; 42 imgs w/o dims |
| `/shop/` | 200 | yes | **none** | All Objects — Handmade Ceramics, Brass & Artisan Hom (71) | 192 | All Objects | — | — | 68 | 0 / 42 | no | Param/variant | no canonical; title 71c; desc 192c; indexable duplicate; no JSON-LD; 42 imgs w/o dims |
| `/?utm_source=test` | 200 | yes | **none** | The Nomad — Handcrafted Home Decor & Travel Gifts fr (67) | 194 | Collectibles WorthBringing Home | — | — | 59 | 0 / 31 | no | Param/variant | no canonical; title 67c; desc 194c; indexable duplicate; no JSON-LD; 31 imgs w/o dims |
