import Link from 'next/link';
import { getTestimonials } from '@/lib/supabase';

// /voices — the letters people send after an object arrives.
//
// Follows the Voices design export, with one deliberate departure: the export
// laid out nine quotes, four stat figures and four short notes, all as
// placeholders. Nothing here invents any of that. Every figure is counted from
// real published rows, and each block only appears if it has something real to
// show. A page with two letters should look like a page with two letters.

export const revalidate = 60;

export const metadata = {
  title: 'Voices — what people wrote back',
  description:
    'Letters from people who bought something from The Nomad — where the object ended up, and what happened to it there.',
};

const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';
const SAND = '#F2E38F';

function Stat({ n, label }) {
  return (
    <div>
      <div className="serif" style={{ fontSize: 46, lineHeight: 1, fontWeight: 300 }}>{n}</div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: MUTED,
          marginTop: 10,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Card({ t }) {
  return (
    <figure
      style={{
        background: '#FFFFFF',
        padding: '44px 38px',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 340,
      }}
    >
      <div>
        <div style={{ width: 26, height: 2, background: SAND, marginBottom: 26 }} />
        <blockquote className="serif" style={{ margin: 0, fontSize: 24, lineHeight: 1.55, color: INK }}>
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

export default async function VoicesPage() {
  let letters = [];
  let failed = false;
  try {
    letters = await getTestimonials();
  } catch {
    failed = true;
  }

  const featured = letters.find((t) => t.featured) || null;
  const rest = letters.filter((t) => t !== featured);

  // Every figure below is counted, never asserted. If there is nothing to
  // count, the row does not appear.
  const cities = new Set(letters.map((t) => t.city).filter(Boolean)).size;
  const countries = new Set(letters.map((t) => t.country).filter(Boolean)).size;
  const stats = [
    letters.length ? { n: letters.length, label: letters.length === 1 ? 'Letter' : 'Letters' } : null,
    cities ? { n: cities, label: cities === 1 ? 'City' : 'Cities' } : null,
    countries ? { n: countries, label: countries === 1 ? 'Country represented' : 'Countries represented' } : null,
  ].filter(Boolean);

  return (
    <main>
      <section style={{ background: '#EEECE6', padding: '88px 40px 80px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: MUTED,
              marginBottom: 22,
            }}
          >
            Letters from collectors
          </div>
          <h1
            className="serif"
            style={{
              fontWeight: 300,
              // "collectors" and the long words below need room on a phone;
              // a fixed 82px would run off a 390px screen.
              fontSize: 'clamp(42px, 9vw, 82px)',
              lineHeight: 1,
              margin: '0 0 26px',
            }}
          >
            What people wrote back
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#4A4A47', maxWidth: '56ch', margin: '0 auto' }}>
            We do not ask for reviews. Every so often somebody writes to us anyway — usually to tell
            us where the object ended up, and occasionally to send a photograph of it there.
          </p>
          {stats.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 64,
                flexWrap: 'wrap',
                marginTop: 56,
                paddingTop: 36,
                borderTop: '1px solid #DEDBD3',
              }}
            >
              {stats.map((s) => (
                <Stat key={s.label} n={s.n} label={s.label} />
              ))}
            </div>
          )}
        </div>
      </section>

      {failed && (
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '90px 40px 0', textAlign: 'center' }}>
          <div className="serif" style={{ fontSize: 30, fontWeight: 300, marginBottom: 12 }}>
            We could not open the letters just now.
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, maxWidth: '48ch', margin: '0 auto' }}>
            Nothing is lost — they simply did not come back this time. Try again in a moment.
          </p>
        </section>
      )}

      {!failed && letters.length === 0 && (
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 40px 0', textAlign: 'center' }}>
          <div className="serif" style={{ fontSize: 34, fontWeight: 300, marginBottom: 16 }}>
            Nobody has written yet.
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, maxWidth: '52ch', margin: '0 auto 30px' }}>
            When somebody does, their letter will sit here exactly as they sent it. We would rather
            leave this page empty than fill it with anything we did not receive.
          </p>
          <Link
            href="/shop"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            See the objects →
          </Link>
        </section>
      )}

      {featured && (
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 40px 0' }}>
          <div style={{ maxWidth: '46ch' }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: MUTED,
                marginBottom: 26,
              }}
            >
              {featured.city ? `Sent to us from ${featured.city}` : 'Sent to us'}
            </div>
            <blockquote
              className="serif"
              style={{
                margin: '0 0 34px',
                fontSize: 'clamp(24px, 3.4vw, 38px)',
                lineHeight: 1.45,
                fontStyle: 'italic',
                color: INK,
              }}
            >
              “{featured.quote}”
            </blockquote>
            <div style={{ fontSize: 14 }}>{featured.name}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
              {[featured.city, featured.object].filter(Boolean).join(' · ')}
            </div>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section style={{ maxWidth: 1560, margin: '0 auto', padding: '110px 40px 0' }}>
          <div
            style={{
              borderBottom: `1px solid ${LINE}`,
              paddingBottom: 24,
              marginBottom: 52,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <h2 className="serif" style={{ fontWeight: 300, fontSize: 44, margin: 0 }}>
              In their own words
            </h2>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED }}>
              Unedited, published with permission
            </div>
          </div>
          <div
            className={rest.length >= 3 ? 'grid-3' : 'grid-2'}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(rest.length, 3)},1fr)`,
              gap: 1,
              background: LINE,
              border: `1px solid ${LINE}`,
            }}
          >
            {rest.map((t) => (
              <Card key={t.id} t={t} />
            ))}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '110px 40px 0', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: MUTED,
            marginBottom: 22,
          }}
        >
          Tell us where it ended up
        </div>
        <h2
          className="serif"
          style={{ fontWeight: 300, fontSize: 'clamp(30px, 5vw, 52px)', lineHeight: 1.1, margin: '0 0 22px' }}
        >
          Every object has a second story
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED, maxWidth: '50ch', margin: '0 auto 36px' }}>
          If something you bought from us has found its place — a desk, a shelf, a kitchen window —
          write to us. We publish the ones that make us want to go back, and only ever with your say-so.
        </p>
        <Link
          href="/contact"
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
          Write to us →
        </Link>
      </section>
    </main>
  );
}
