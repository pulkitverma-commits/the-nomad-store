import Link from 'next/link';
import { getTestimonials } from '@/lib/supabase';

// The home page's testimonial band, sitting just above the footer.
//
// Shows at most three published letters and sends people to /voices for the
// rest. Deliberately built for a small number of real letters: two honest
// quotes read better than nine invented ones, so the layout is chosen from how
// many exist — one goes wide, two sit side by side, three fall into the
// hairline grid. With none, the section does not render at all, which is the
// correct look for a shop nobody has written to yet.
//
// Content lives in the `testimonials` table and is edited in the admin panel.
// Only rows ticked `published` are ever returned.

const LINE = '#E8E8E5';
const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';

const HOME_LIMIT = 3;

function Quote({ t, big }) {
  return (
    <figure
      style={{
        background: '#FFFFFF',
        padding: big ? '52px 48px' : '44px 38px',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: big ? 0 : 300,
      }}
    >
      <div>
        {/* The short rule is the same device the product cards use — it keeps
            this section reading as part of the shop, not a bolted-on widget. */}
        <div style={{ width: 26, height: 2, background: '#F2E38F', marginBottom: 26 }} />
        <blockquote
          className="serif"
          style={{
            margin: 0,
            fontSize: big ? 34 : 24,
            lineHeight: big ? 1.45 : 1.55,
            color: INK,
          }}
        >
          “{t.quote}”
        </blockquote>
      </div>
      <figcaption style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid #F2F1ED' }}>
        <div style={{ fontSize: 13 }}>{t.name}</div>
        {t.city && <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>{t.city}</div>}
        {t.object && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: FAINT,
              marginTop: 12,
            }}
          >
            {t.object}
          </div>
        )}
      </figcaption>
    </figure>
  );
}

export default async function Voices() {
  let all = [];
  try {
    all = await getTestimonials();
  } catch {
    // A section that cannot load its own content should be absent, not broken.
    return null;
  }
  if (all.length === 0) return null;

  // Featured first, then whatever order the admin set.
  const ordered = [...all.filter((t) => t.featured), ...all.filter((t) => !t.featured)];
  const list = ordered.slice(0, HOME_LIMIT);
  const columns = Math.min(list.length, 3);

  return (
    <section
      aria-labelledby="voices-heading"
      style={{ maxWidth: 1560, margin: '0 auto', padding: '120px 40px 0' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${LINE}`,
          paddingBottom: 26,
          marginBottom: 52,
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: MUTED,
              marginBottom: 16,
            }}
          >
            Letters from collectors
          </div>
          <h2
            id="voices-heading"
            className="serif"
            style={{ fontWeight: 300, fontSize: 46, lineHeight: 1, margin: 0 }}
          >
            What people wrote back
          </h2>
        </div>
        <Link
          href="/voices"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          {all.length > list.length ? `All ${all.length} letters →` : 'Read the letters →'}
        </Link>
      </div>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.8,
          color: MUTED,
          maxWidth: '62ch',
          margin: '-22px 0 46px',
        }}
      >
        We do not ask for reviews. Every so often somebody writes to us anyway — usually to tell us
        where the object ended up, and occasionally to send a photograph of it there.
      </p>

      {/* The 1px gap over a line-coloured background is what draws the hairline
          rules between cards; grid-3 / grid-2 collapse it on small screens. */}
      <div
        className={columns === 3 ? 'grid-3' : 'grid-2'}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns},1fr)`,
          gap: 1,
          background: LINE,
          border: `1px solid ${LINE}`,
        }}
      >
        {list.map((t) => (
          <Quote key={t.id} t={t} big={list.length === 1} />
        ))}
      </div>

      <div
        style={{
          marginTop: 34,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 13, lineHeight: 1.7, color: MUTED, maxWidth: '52ch' }}>
          If something you bought from us has found its place — a desk, a shelf, a kitchen window —
          write and tell us where.
        </div>
        <Link
          href="/contact"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Write to us →
        </Link>
      </div>
    </section>
  );
}
