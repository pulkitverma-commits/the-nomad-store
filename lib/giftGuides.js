// The gift guides at /gifts/<slug>.
//
// Every guide is a filter over the real `products` table plus editorial copy
// written for it. There is no separate list of hand-picked ids to fall out of
// date: add an object to the shop and it appears in whichever guides it
// qualifies for, or in none.
//
// Three guides exist and no more, because only three are supported by the
// inventory. Deliberately absent:
//
//   · material pages — 40 distinct materials across 42 objects, so nearly
//     every one would be a page about a single product;
//   · city pages — 21 of 29 cities have exactly one object;
//   · "gifts under ₹5,000" — that is the entire catalogue and the shop's
//     standing promise, so /gifts itself carries that intent rather than a
//     fourth page duplicating /shop.

export const GIFT_GUIDES = [
  {
    slug: 'under-1500',
    title: 'Gifts Under ₹1,500',
    heading: 'Under ₹1,500',
    kicker: 'Gift guide',
    metaTitle: 'Gifts Under ₹1,500 — Handcrafted, from 18 Countries',
    metaDescription:
      'Handcrafted gifts under ₹1,500 — ceramics, brass, cork and letterpress paper bought directly from workshops abroad and wrapped with the object’s passport card.',
    lede: 'Small objects, properly made. The price is low because the object is small, not because the making was cheap.',
    body: [
      'This is the shelf people reach for when they need a real gift and not a big one — a cup, a coaster set, a letterpress card, a brass hook. Everything here came home in the same suitcase as the expensive things, from the same workshops, chosen on the same test: would we keep it ourselves.',
      'Nothing in this range is a sample, a second or a factory line dressed up. Where an object is inexpensive it is because it is small or because the material is ordinary — cork, paper, terracotta — and not because a corner was cut. Each one still leaves us wrapped in unbleached paper with its own passport card recording where it was found and by whom.',
    ],
    filter: (p) => p.price < 1500,
    sort: (a, b) => a.price - b.price,
  },
  {
    slug: 'under-3000',
    title: 'Gifts Under ₹3,000',
    heading: 'Under ₹3,000',
    kicker: 'Gift guide',
    metaTitle: 'Gifts Under ₹3,000 — Artisan Home Decor & Objects',
    metaDescription:
      'Handcrafted gifts under ₹3,000 from 18 countries: handmade ceramics, brass, marble and olive wood, bought in the workshop and brought home to India.',
    lede: 'The range most gifts land in — enough for a proper ceramic piece, a brass object or a marble one.',
    body: [
      'Three thousand rupees buys, in most of the places we visit, an object a workshop is genuinely proud of: a hand-glazed bowl, a hammered brass dish, a marble paperweight cut from the same quarry as the building down the road. That is the band this guide covers.',
      'It is also the range where the difference between handmade and handmade-looking stops being subtle. You can feel a wheel-thrown wall thin out towards the rim, and see where a chaser worked around a brass edge by hand. Where an object here was made on a machine we say so on its page — a Zurich ruler turned on a lathe is not worse for it, and we would rather be exact than romantic.',
    ],
    filter: (p) => p.price < 3000,
    sort: (a, b) => a.price - b.price,
  },
  {
    slug: 'housewarming',
    title: 'Housewarming Gifts',
    heading: 'Housewarming',
    kicker: 'Gift guide',
    metaTitle: 'Unique Housewarming Gifts — Handcrafted Home & Table',
    metaDescription:
      'Unique housewarming gifts from 18 countries: handmade ceramics, brass, terracotta and olive wood for the table and the home, each with its own passport card.',
    lede: 'Objects for a house someone has just started living in — for the table and for the rooms around it.',
    body: [
      'A housewarming gift has a specific job: it has to be useful enough to survive the first month, and good enough that it is still out five years later. Everything in this guide is drawn from the two categories where that is true of our objects — Table and Home — which is to say the things that get used daily rather than displayed.',
      'What we would avoid is anything that assumes how someone decorates. A terracotta jug, a stoneware bowl or a brass dish sits in almost any room; a colour-matched ornament does not. If you are buying for a housewarming you have not seen, the safest good gift here is something for the kitchen table, and the safest bad one is anything that has to go on a wall.',
    ],
    filter: (p) => p.category === 'Home' || p.category === 'Table',
    sort: (a, b) => a.price - b.price,
  },
];

export function findGuide(slug) {
  return GIFT_GUIDES.find((g) => g.slug === slug) || null;
}

export function guideProducts(guide, products) {
  return products.filter(guide.filter).sort(guide.sort);
}
