// Checks the menu-bar palette: right tone per route, legible ink on every one,
// and no tone that collides with the section sitting behind the bar.
// Run: node scripts/test-nav-tone.mjs

import { navTone, DEFAULT_TONE } from '../lib/navTone.js';

let pass = 0;
let fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const dist = (a, b) => Math.sqrt(hex(a).reduce((t, v, i) => t + (v - hex(b)[i]) ** 2, 0));

console.log('\nrouting');
check('home gets the default cream', navTone('/') === DEFAULT_TONE);
check('an unknown route falls back', navTone('/nothing-here') === DEFAULT_TONE);
check('/shop has its own tone', navTone('/shop') !== DEFAULT_TONE);
check('nested routes inherit the section', navTone('/journal/some-slug') === navTone('/journal'));
check('/product differs from /shop', navTone('/product/x') !== navTone('/shop'));
check('/country/japan resolves', navTone('/country/japan') === navTone('/country'));
check('/signin matches /account', navTone('/signin') === navTone('/account'));
check('prefix is not a substring match', navTone('/shopping-list') === DEFAULT_TONE, navTone('/shopping-list'));

const ROUTES = ['/', '/shop', '/product/x', '/country/japan', '/gifts', '/drops', '/journal',
  '/world', '/voices', '/about', '/soon', '/saved', '/account', '/signin', '/contact'];

console.log('\nlegibility (ink #111111 and the dark Bag button on every tone)');
for (const r of ROUTES) {
  const t = navTone(r);
  const c = contrast(t, '#111111');
  check(`${r.padEnd(16)} ${t} contrast ${c.toFixed(1)}:1`, c >= 7, '(want >= 7:1)');
}

console.log('\npaleness — nothing that competes with the objects');
for (const r of ROUTES) {
  const t = navTone(r);
  check(`${r.padEnd(16)} ${t} is pale`, lum(t) > 0.75, `luminance ${lum(t).toFixed(3)}`);
}

console.log('\ndistinct from what sits behind the bar');
// The pill is separated from the page mainly by its border and a 32px drop
// shadow, not by colour — the original design floated cream #FFFDF4 on a white
// page and reads fine. So the bar for "distinct enough" is that pairing, not a
// number pulled out of the air: every tone must be at least as distinguishable
// from its backdrop as the design already accepted.
const BASELINE = dist('#FFFDF4', '#FFFFFF');
console.log(`  (baseline: the original cream-on-white pill, distance ${BASELINE.toFixed(1)})`);
const backdrop = [
  ['/', '#F2E38F', 'the sand hero'],
  ['/voices', '#EEECE6', 'the oat band'],
  ['/about', '#EEECE6', 'the oat band'],
  ['/gifts', '#F3E0CE', 'the gift panel'],
  ['/shop', '#FFFFFF', 'the white page'],
  ['/journal', '#FFFFFF', 'the white page'],
];
for (const [route, behind, what] of backdrop) {
  const d = dist(navTone(route), behind);
  check(`${route.padEnd(9)} reads against ${what}`, d >= BASELINE, `distance ${d.toFixed(1)} < ${BASELINE.toFixed(1)}`);
}

console.log('\nneighbouring sections are actually telling apart');
const seen = new Map();
let collisions = 0;
for (const r of ROUTES) {
  const t = navTone(r);
  for (const [otherRoute, otherTone] of seen) {
    // /signin and /account share on purpose; so do the policy pages.
    const intentional = (r === '/signin' && otherRoute === '/account');
    if (!intentional && otherTone === t) { collisions++; console.log(`        note: ${r} and ${otherRoute} share ${t}`); }
  }
  seen.set(r, t);
}
check('no unintended duplicate tones', collisions === 0);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
