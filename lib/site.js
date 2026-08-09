// The shop's public address, in one place.
//
// This used to be duplicated: lib/mail.js and lib/authMail.js read the env var,
// while sitemap.js, robots.js and layout.js each hardcoded the vercel.app URL
// and ignored it. That split is invisible until the domain changes — then the
// emails move to the new address while every canonical tag, OG image URL and
// sitemap entry keeps pointing at the old one, which reads to a search engine
// as two sites with identical content.
//
// Set NEXT_PUBLIC_SITE_URL in Vercel. The fallback is the deploy URL, which is
// right for previews and for a local checkout with no env file.

const RAW = process.env.NEXT_PUBLIC_SITE_URL || 'https://the-nomad-store.vercel.app';

// Trailing slashes turn `${SITE}/shop` into `//shop`, so they are trimmed once
// here rather than being remembered at forty call sites.
export const SITE_URL = RAW.replace(/\/+$/, '');

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

export default SITE_URL;
