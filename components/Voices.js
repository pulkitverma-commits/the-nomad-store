import Link from 'next/link';
import { testimonials } from '@/lib/testimonials';

// The home page's testimonial band, sitting just above the footer.
//
// Deliberately built for a small number of real letters rather than a wall of
// them. Two honest quotes read better than nine invented ones, and the layout
// is chosen at render time so it never looks like there are gaps waiting to be
// filled: one quote goes wide, two sit side by side, three or more fall into a
// hairline grid. With none, the section does not render at all.

const LINE = '#E8E8E5';
const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';

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
      <figcaption style={{ marginTop: 36, paddingTop: 20, borderTop: `1px solid #F2F1ED` }}>
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

export default function Voices() {
  const list = testimonials.filter((t) => t && t.quote && t.name);
  if (list.length === 0) return null;

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
        <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED }}>
          Unedited, published with permission
        </div>
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
          rules between cards; grid-3 collapses it to one column under 640px. */}
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
        {list.map((t, i) => (
          <Quote key={`${t.name}-${i}`} t={t} big={list.length === 1} />
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
