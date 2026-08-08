# The Nomad — Collectibles Worth Bringing Home

An editorial e-commerce storefront for travel-curated artisan objects, built from a design
prototype. Live at https://the-nomad-store.vercel.app

## Stack

- **Next.js 14** (App Router) — storefront + admin panel, deployed on **Vercel**
- **Supabase Postgres** — products, journal, drops, orders, subscribers, notify requests;
  row-level security throughout; checkout via a `place_order` security-definer function that
  validates stock atomically
- **Supabase Auth** — admin login (email/password; magic link and Google/Microsoft OAuth
  buttons ready once providers are enabled in the Supabase dashboard)
- **Cloudinary** — all product/journal/country photography (`nomad/<id>` public IDs) with
  `q_auto,f_auto` delivery; admin image uploads are signed server-side via
  `/api/admin/sign-upload` (the API secret lives in the RLS-protected `app_config` table,
  readable only by admin sessions)
- **Unsplash** — source photography (credited per product)
- SEO informed by **Semrush** keyword research; JSON-LD product schema, sitemap, robots

## Structure

```
app/            routes (storefront, /admin, API routes)
components/     UI components (+ components/admin/AdminApp.js — the back office)
lib/            Supabase client + formatting/image helpers
```

## Admin

`/admin` — products CRUD with Cloudinary image upload, live stock/price editing,
orders with line items, and newsletter / drop-list / notify-me signups.
Access is limited to emails in the `admin_users` table.

## Development

```
npm install
npm run dev
```

Environment (optional — sensible defaults are baked in for the demo project):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```
