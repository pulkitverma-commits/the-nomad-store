import Link from 'next/link';
import { getProducts, getArticles, getComingSoon } from '@/lib/supabase';
import { inr, img, productImg, countrySlug, COUNTRY_PHOTOS } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import SectionHead from '@/components/SectionHead';
import Countdown from '@/components/Countdown';
import WorldMap from '@/components/WorldMap';
import NotifyButton from '@/components/NotifyButton';
import HeroPostcards from '@/components/HeroPostcards';
import Voices from '@/components/Voices';
import { GIFT_GUIDES, guideProducts } from '@/lib/giftGuides';

export const revalidate = 60;

export const metadata = {
  title: { absolute: 'The Nomad — Handcrafted Home Decor & Gifts, 18 Countries' },
  description:
    'Handcrafted home decor and artisan travel gifts — handmade ceramics, brass, marble and letterpress objects discovered across 18 countries. Nothing over ₹5,000.',
  alternates: { canonical: '/' },
  openGraph: { url: '/', type: 'website', siteName: 'The Nomad' },
};

const sticker = (extra) => ({
  position: 'absolute',
  zIndex: 3,
  whiteSpace: 'nowrap',
  boxShadow: '0 8px 22px rgba(17,17,17,0.14)',
  ...extra,
});

// parcelworks straddles the hero's bottom edge, so it lives outside the sticker
// list — the hero clips its overflow and would cut it in half. 266px is 40%
// larger than the 190px it ran at inside. `ratio` is the artwork's own aspect
// (1458 x 336), used to push exactly half its height below the seam.
const SEAM_STICKER = { w: 266, ratio: 1458 / 336 };

// The brand marks scattered inside the hero. Widths are per sticker rather than
// shared, because the aspect ratios run from 1.2:1 (Bloom Sends, which is two
// lines) to 5.1:1 (shipped with care) — a single width would make the wide ones
// enormous and the square one a stamp.
const HERO_STICKERS = [
  { id: 'marlow', w: 150, at: { left: '9%', top: '54%', transform: 'rotate(6deg)' } },
  // Raised 100px off its original 11%. Kept as a calc rather than folded into
  // a new percentage so the offset stays a fixed 100px at every viewport —
  // 11% of this section is ~140px, so a percentage would drift with height.
  { id: 'bloomsends', w: 118, at: { left: '5%', bottom: 'calc(11% + 100px)', transform: 'rotate(-12deg)' } },
  { id: 'homestead', w: 180, at: { right: '5.5%', top: '40%', transform: 'rotate(7deg)' } },
  { id: 'fletch', w: 155, at: { right: '9%', top: '54%', transform: 'rotate(-5deg)' } },
  { id: 'trustedsupply', w: 175, at: { right: '5%', bottom: '12%', transform: 'rotate(4deg)' } },
  // The widest of the set. At 375px it is big enough to reach the headline, so
  // its width tracks the space actually available beside it rather than a flat
  // number or a plain vw fraction.
  //
  // The headline caps at 96px, so "Bringing Home" stays ~566px wide and its
  // left edge sits at roughly vw/2 - 283. With the sticker at left:2%, keeping
  // a 20px gap means width <= 0.48vw - 303. That is the calc below, capped at
  // 375 and floored at 150. Measured in an iframe at 1000/1100/1200/1280 it
  // holds the gap at exactly 20px, and at 1470 it reaches full size with 48px
  // to spare. A flat 375 collides with the headline from 1280 down.
  {
    id: 'shippedwithcare',
    w: 375,
    wCss: 'clamp(150px, calc(48vw - 303px), 375px)',
    at: { left: '2%', top: '30%', transform: 'rotate(-6deg)' },
  },
];

export default async function Home() {
  const [products, articles, soon] = await Promise.all([
    getProducts(),
    getArticles(),
    getComingSoon(),
  ]);

  const countryCounts = {};
  products.forEach((p) => (countryCounts[p.country] = (countryCounts[p.country] || 0) + 1));
  const cityCounts = {};
  products.forEach((p) => (cityCounts[p.city] = (cityCounts[p.city] || 0) + 1));
  const countryList = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]);
  const mapCities = Object.values(
    products.reduce((m, p) => {
      m[p.city] = { city: p.city, country: p.country, lat: p.lat, lon: p.lon, count: cityCounts[p.city] };
      return m;
    }, {})
  );

  const arrivals = products.slice(0, 4);
  const tokyoEdit = products.filter((p) => p.city === 'Tokyo' || p.city === 'Osaka').slice(0, 3);
  const journalHome = articles.slice(0, 3);
  // Three of these six tiles used to quote counts nobody could source
  // ("Gifts for designers · 11 objects") and all six linked to /gifts. Each
  // one is now a real edit with a real count and its own destination.
  const giftTiles = [
    ...GIFT_GUIDES.map((g) => ({
      label: g.heading,
      meta: guideProducts(g, products).length + ' objects',
      href: `/gifts/${g.slug}`,
    })),
    { label: 'Under ₹5,000', meta: products.length + ' objects', href: '/gifts' },
    ...countryList.slice(0, 2).map((c) => ({
      label: `From ${c}`,
      meta: countryCounts[c] + (countryCounts[c] === 1 ? ' object' : ' objects'),
      href: `/country/${countrySlug(c)}`,
    })),
  ];
  const foundThisWeek = [
    { name: 'Porcelain soy dish', note: 'Tokyo · 4 found' },
    { name: 'Mini incense stand', note: 'Nara · 2 found' },
    { name: 'Letterpress notebook', note: 'Tokyo · 12 found' },
    { name: 'Aluminium desk tray', note: 'Seoul · 6 found' },
  ];

  return (
    <main style={{ background: '#FCF7E8' }}>
      {/* HERO
          Wrapped because the section clips its own overflow (which keeps the
          postcards and stickers inside it). The parcelworks sticker straddles
          the hero's bottom edge, so it has to be positioned against something
          that does not clip — hence this wrapper rather than the section. */}
      <div style={{ position: 'relative' }}>
      <section
        style={{
          position: 'relative',
          marginTop: -80,
          background: '#F2E38F',
          overflow: 'hidden',
          padding: '164px 40px 96px',
        }}
      >
        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', textAlign: 'center', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-block',
              border: '1px solid rgba(17,17,17,0.25)',
              borderRadius: 999,
              padding: '10px 26px',
              fontSize: 11,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#4A4A47',
              background: 'rgba(255,253,244,0.55)',
              marginBottom: 36,
            }}
          >
            New — Drop 006 · Tokyo · lands Sunday 11:00 IST
          </div>
          <h1
            className="serif"
            /* "Collectibles" is a 12-character word and a word cannot wrap.
               At a fixed 96px it is wider than a 390px phone and would push the
               whole page sideways — the same overflow class of bug fixed
               earlier. The clamp keeps the desktop size and lets the word
               shrink on narrow screens. */
            style={{
              fontWeight: 400,
              fontSize: 'clamp(40px, 10.5vw, 96px)',
              lineHeight: 0.98,
              letterSpacing: '-0.01em',
              margin: '0 0 26px',
            }}
          >
            Collectibles Worth
            <br />
            Bringing Home
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: '#3A3A37', maxWidth: '52ch', margin: '0 auto 38px' }}>
            A collection of remarkable objects discovered across cities, cultures and corners of the
            world — brought home to India.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 70, flexWrap: 'wrap' }}>
            <Link
              href="/shop"
              className="btn-dark"
              style={{ borderRadius: 999, fontSize: 13, fontWeight: 600, padding: '16px 32px', color: '#FFFDF4' }}
            >
              Explore the collection →
            </Link>
            <Link
              href="/world"
              className="btn-outline"
              style={{ borderRadius: 999, fontSize: 13, fontWeight: 600, padding: '16px 32px' }}
            >
              Travel by country
            </Link>
          </div>
          <HeroPostcards />
        </div>
        {HERO_STICKERS.map((st) => (
          <img
            key={st.id}
            className="hero-sticker"
            src={img(`sticker-${st.id}`, st.w * 2)}
            alt=""
            /* Decorative brand marks. Announcing six logos to a screen reader
               between the headline and the call to action would be noise. */
            aria-hidden="true"
            loading="lazy"
            width={st.w}
            style={sticker({
              ...st.at,
              // `wCss` lets a sticker shrink in the squeeze between 900px and
              // ~1150px, where the side columns close in on the centred
              // headline. Everything else takes its fixed width.
              width: st.wCss || st.w,
              height: 'auto',
              // These are transparent PNGs, so the shared boxShadow would draw
              // a rectangle around the bounding box rather than the sticker.
              // drop-shadow follows the alpha silhouette instead.
              boxShadow: 'none',
              filter: 'drop-shadow(0 10px 20px rgba(17,17,17,0.14))',
            })}
          />
        ))}
      </section>
      {/* Sits ON the seam between the sand hero and the cream page below —
          half on each, the way a sticker actually lands. Half its own height
          is pushed below the edge, so the offset tracks the artwork rather
          than a magic number. */}
      <img
        className="hero-sticker"
        src={img('sticker-parcelworks', SEAM_STICKER.w * 2)}
        alt=""
        aria-hidden="true"
        width={SEAM_STICKER.w}
        style={{
          position: 'absolute',
          zIndex: 4,
          // Moved in from 5.5%. The seam is clear all the way across — the
          // postcard stack ends well above it — so this is free to slide right
          // without colliding with anything.
          left: '15%',
          bottom: -Math.round(SEAM_STICKER.w / SEAM_STICKER.ratio / 2),
          width: SEAM_STICKER.w,
          height: 'auto',
          transform: 'rotate(-9deg)',
          filter: 'drop-shadow(0 10px 20px rgba(17,17,17,0.14))',
        }}
      />
      </div>

      {/* JUST ARRIVED */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '120px 40px 0' }}>
        <SectionHead kicker="New discoveries" title="Just Arrived" linkHref="/shop" linkLabel="All objects →" />
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '40px 32px' }}>
          {arrivals.map((p) => (
            <ProductCard key={p.id} p={p} usePop />
          ))}
        </div>
      </section>

      {/* SHOP THE WORLD */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '130px 40px 0' }}>
        <div
          className="grid-2"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'end', marginBottom: 56 }}
        >
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 62, lineHeight: 1, margin: 0 }}>
            Shop The World
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#6B6B68', margin: 0, maxWidth: '44ch' }}>
            Where should we take you? Every destination is a small edit — a handful of objects chosen
            on the ground, in the workshops and markets where they are made.
          </p>
        </div>
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {countryList.slice(0, 8).map((name, i) => {
            const slug = countrySlug(name);
            const photo = COUNTRY_PHOTOS[slug];
            const cities = [...new Set(products.filter((p) => p.country === name).map((p) => p.city))];
            const pops = ['#F6E3A1', '#F0D3BE', '#D8E2CE', '#CFDDE8', '#EAD6DF', '#E4DCC3'];
            return (
              <Link key={name} href={`/country/${slug}`} style={{ display: 'block' }}>
                <div className="zoomable" style={{ aspectRatio: '3/4', background: pops[i % pops.length] }}>
                  {photo ? (
                    <img src={img(photo, 500)} alt={`Handcrafted objects from ${name}`} loading="lazy" />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: 22,
                        fontSize: 9,
                        letterSpacing: '0.26em',
                        textTransform: 'uppercase',
                        color: '#6B6B68',
                      }}
                    >
                      {name}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 18 }}>
                  {name.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: '#6B6B68', marginTop: 7 }}>{cities.join(' · ')}</div>
                <div style={{ fontSize: 11, color: '#B4B0A6', marginTop: 4 }}>
                  {countryCounts[name]} objects
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TOKYO EDIT */}
      <section style={{ background: '#F7F7F5', marginTop: 130, padding: '110px 0' }}>
        <div
          className="split"
          style={{
            maxWidth: 1560,
            margin: '0 auto',
            padding: '0 40px',
            display: 'grid',
            gridTemplateColumns: '1fr 1.15fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          <div style={{ aspectRatio: '4/5', background: '#E4E2DB', overflow: 'hidden' }}>
            <img
              src={img('1611758497398-5224931d155a', 800)}
              alt="Tokyo — Nakameguro, February"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 22 }}>
              Featured destination
            </div>
            <h2 className="serif" style={{ fontWeight: 300, fontSize: 66, lineHeight: 1, margin: '0 0 26px' }}>
              The Tokyo Edit
            </h2>
            <p
              className="serif"
              style={{ fontSize: 23, lineHeight: 1.5, fontStyle: 'italic', color: '#4A4A47', margin: '0 0 22px', maxWidth: '34ch' }}
            >
              “Quiet objects from one of the world&apos;s most considered design cultures.”
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: '#6B6B68', maxWidth: '48ch', margin: '0 0 40px' }}>
              Six days across Nakameguro, Kuramae and Yanaka. Stationery from a letterpress studio
              that has printed on the same machines since 1948, brass from a Taito-ku workshop, and
              porcelain small enough to carry home in a coat pocket.
            </p>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 38 }}>
              {tokyoEdit.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`}>
                  <div className="zoomable" style={{ aspectRatio: '1', background: p.pop }}>
                    <img src={productImg(p, 300)} alt={p.name} loading="lazy" />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 12 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6B6B68', marginTop: 4 }}>{inr(p.price)}</div>
                </Link>
              ))}
            </div>
            <Link
              href="/country/japan"
              className="underline-link"
              style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
            >
              Explore Japan →
            </Link>
          </div>
        </div>
      </section>

      {/* MAP */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '120px 40px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 18 }}>
            Where we have been
          </div>
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1, margin: 0 }}>
            Every object has coordinates
          </h2>
        </div>
        <div style={{ position: 'relative', background: '#F7F7F5', padding: 40 }}>
          <WorldMap cities={mapCities} aspect="2.35/1" dotSize={22} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid #E8E8E5',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6B68' }}>
              {mapCities.length} cities · {countryList.length} countries · {products.length} objects collected
            </div>
            <Link
              href="/world"
              className="underline-link"
              style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', paddingBottom: 3 }}
            >
              Open the full map →
            </Link>
          </div>
        </div>
      </section>

      {/* DROP + FOUND THIS WEEK */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '120px 40px 0' }}>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div
            style={{
              background: '#E8F0E6',
              color: '#111111',
              padding: '64px 56px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 460,
            }}
          >
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#5A5A57', marginBottom: 28 }}>
                Nomad Drop 006
              </div>
              <h2 className="serif" style={{ fontWeight: 300, fontSize: 64, lineHeight: 1, margin: '0 0 18px' }}>
                Tokyo
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#4A4A47', maxWidth: '38ch', margin: 0 }}>
                Twenty-eight objects, collected over six days and released at once. When they are
                gone, they are gone.
              </p>
            </div>
            <div>
              <div style={{ marginBottom: 38 }}>
                <Countdown size={44} />
              </div>
              <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/drops"
                  style={{
                    background: '#111111',
                    color: '#FFFDF4',
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    padding: '15px 28px',
                  }}
                >
                  Join the list
                </Link>
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5A5A57' }}>
                  Sunday · 11:00 IST · 28 objects
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              border: '1px solid #E8E8E5',
              padding: 56,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#FFFFFF',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderBottom: '1px solid #E8E8E5',
                  paddingBottom: 18,
                  marginBottom: 30,
                }}
              >
                <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68' }}>
                  Found this week
                </div>
                <div className="serif" style={{ fontStyle: 'italic', fontSize: 19, color: '#6B6B68' }}>
                  Tokyo, 04.08
                </div>
              </div>
              {foundThisWeek.map((f) => (
                <div
                  key={f.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 20,
                    padding: '16px 0',
                    borderBottom: '1px dotted #E8E8E5',
                  }}
                >
                  <div className="serif" style={{ fontSize: 22 }}>{f.name}</div>
                  <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B4B0A6' }}>
                    {f.note}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 13, color: '#6B6B68' }}>3 objects arriving soon</div>
              <Link
                href="/soon"
                className="underline-link"
                style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', paddingBottom: 3 }}
              >
                See what we found →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMING HOME SOON */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '120px 40px 0' }}>
        <SectionHead title="Coming Home Soon" right="Sourced abroad · not yet in India" />
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
          {soon.slice(0, 3).map((s) => (
            <div key={s.obj_no} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 24, alignItems: 'start' }}>
              <div style={{ aspectRatio: '1', background: '#F2F1ED' }} />
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6' }}>
                  {s.obj_no}
                </div>
                <div style={{ fontSize: 15, marginTop: 10 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#6B6B68', marginTop: 5 }}>{s.origin}</div>
                <div style={{ fontSize: 12, color: '#6B6B68', marginTop: 14 }}>Arriving {s.eta}</div>
                <NotifyButton itemName={s.name} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* JOURNAL */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '120px 40px 0' }}>
        <SectionHead kicker="Stories" title="The Nomad Journal" linkHref="/journal" linkLabel="All stories →" />
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 36 }}>
          {journalHome.map((j) => (
            <Link key={j.slug} href={`/journal/${j.slug}`} style={{ display: 'block' }}>
              <div className="zoomable" style={{ aspectRatio: '3/2', background: j.tone }}>
                <img src={img(j.photo_id, 600)} alt={j.caption} loading="lazy" />
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#6B6B68', marginTop: 20 }}>
                {j.kicker}
              </div>
              <div className="serif" style={{ fontSize: 29, lineHeight: 1.2, marginTop: 12 }}>{j.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: '#6B6B68', marginTop: 12 }}>{j.excerpt}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* GIFTS */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '120px 40px 0' }}>
        <div
          className="split"
          style={{
            background: '#F3E0CE',
            padding: '80px 64px',
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            gap: 70,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
              Gifting
            </div>
            <h2 className="serif" style={{ fontWeight: 300, fontSize: 54, lineHeight: 1.02, margin: '0 0 22px' }}>
              Gifts From Somewhere Else
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: '#6B6B68', maxWidth: '40ch', margin: '0 0 32px' }}>
              Wrapped in unbleached paper, sealed by hand, and sent with the object&apos;s passport card.
            </p>
            <Link
              href="/gifts"
              className="btn-dark"
              style={{
                display: 'inline-block',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '15px 28px',
                color: '#FFFFFF',
              }}
            >
              The Gift Shop →
            </Link>
          </div>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1, background: '#E3CDB8' }}>
            {giftTiles.map((g) => (
              <Link
                key={g.label}
                href={g.href}
                className="gift-tile"
                style={{
                  background: '#F3E0CE',
                  padding: '26px 24px',
                  minHeight: 104,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 14 }}>{g.label}</div>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B68' }}>
                  {g.meta}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VOICES — the last thing read before the footer. */}
      <Voices />
    </main>
  );
}
