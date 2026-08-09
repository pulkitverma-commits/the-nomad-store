/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },

  async redirects() {
    return [
      // The Vercel production alias serves the entire site at 200, so every
      // page has an exact duplicate on a second host. Canonicals point at
      // www.thenomad.buzz, but a duplicate that answers 200 is still a
      // duplicate — this makes the alias redirect instead.
      //
      // Matched on the host, so per-deployment preview URLs
      // (the-nomad-store-git-*.vercel.app) are untouched and still work.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'the-nomad-store.vercel.app' }],
        destination: 'https://www.thenomad.buzz/:path*',
        permanent: true,
      },

      // countrySlug used to turn "Türkiye" into `t-rkiye`; it now produces
      // `turkiye`. The old URL was live and in the sitemap, so it redirects
      // rather than starting to 404.
      {
        source: '/country/t-rkiye',
        destination: '/country/turkiye',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
