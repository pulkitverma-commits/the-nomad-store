// The shop's public address, in one place.
//
// This used to be duplicated: lib/mail.js and lib/authMail.js read the env var,
// while sitemap.js, robots.js and layout.js each hardcoded the vercel.app URL
// and ignored it. That split is invisible until the domain changes — then the
// emails move to the new address while every canonical tag, OG image URL and
// sitemap entry keeps pointing at the old one, which reads to a search engine
// as two sites with identical content.
//
// NEXT_PUBLIC_SITE_URL is set in Vercel. The fallback used to be the
// the-nomad-store.vercel.app deploy URL, which is now the wrong answer in the
// one case that matters: if the variable were ever dropped, every canonical
// tag and every sitemap entry would quietly start naming the duplicate host
// instead of the live domain. The fallback is now the canonical host, so the
// failure mode of a missing variable is "correct" rather than "silently
// splits the site in two".
const RAW = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thenomad.buzz';

// Trailing slashes turn `${SITE}/shop` into `//shop`, so they are trimmed once
// here rather than being remembered at forty call sites.
export const SITE_URL = RAW.replace(/\/+$/, '');

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

export default SITE_URL;
