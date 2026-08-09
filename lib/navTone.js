// The colour of the floating menu bar, chosen by which page you are on.
//
// The bar sits over whatever the page puts behind it — the sand hero on the
// home page, the oat band on /voices — so every tone here is picked to sit
// *next to* that section rather than match it. A pill the same colour as the
// band behind it stops looking like a pill.
//
// All of these are deliberately pale. The bar carries ink text at #111111 and
// a dark Bag button, and both need to stay legible; every tone below is light
// enough to clear WCAG AA for body text several times over. If you add one,
// keep it in the same register: warm, desaturated, nothing that competes with
// the objects themselves.

export const DEFAULT_TONE = '#FFFDF4'; // the original cream

// Order matters — the first matching prefix wins, so put specific routes above
// the sections that contain them.
const TONES = [
  ['/shop', '#FBEDE7'], // blush
  ['/product', '#F6EFE6'], // warm oat, a shade off the shop it came from
  ['/country', '#E9F0E6'], // sage
  ['/gifts', '#FBEADB'], // peach, echoing the gift tiles
  ['/drops', '#EFEAF6'], // lilac
  ['/journal', '#E7EFF5'], // sky
  ['/world', '#E4F0EC'], // mint
  ['/voices', '#F7E8DE'], // apricot, warmed off the oat band that sits behind it
  ['/soon', '#E9ECF7'], // periwinkle
  ['/saved', '#F7E9EE'], // rose
  ['/account', '#EDEDE8'], // stone
  ['/signin', '#EDEDE8'], // stone, so signing in feels like the account area
  ['/order-lookup', '#EDEDE8'],
  ['/contact', '#F2EFE9'], // linen
  ['/unsubscribe', '#F2EFE9'],
  ['/shipping', '#F2EFE9'],
  ['/returns', '#F2EFE9'],
  ['/terms', '#F2EFE9'],
  ['/privacy', '#F2EFE9'],
  ['/faq', '#F2EFE9'],
];

/**
 * @param {string} pathname
 * @returns {string} a hex colour for the menu bar background
 */
export function navTone(pathname) {
  const p = String(pathname || '/');
  if (p === '/') return DEFAULT_TONE;
  const hit = TONES.find(([prefix]) => p === prefix || p.startsWith(`${prefix}/`));
  return hit ? hit[1] : DEFAULT_TONE;
}

export default navTone;
