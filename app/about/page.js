import { getAbout } from '@/lib/supabase';
import { img } from '@/lib/format';
import { NAV_RESERVE } from '@/lib/nav';

// /about — who runs the shop and how it buys.
//
// Follows the About design export. Every string and every list comes from the
// single `about_page` row so the whole page is editable from the back office;
// nothing here is hardcoded copy. Blocks that have no content simply do not
// render, which keeps a half-filled page from showing empty furniture.

export const revalidate = 60;

export const metadata = {
  title: 'About — A Shop That Started as a Suitcase',
  description:
    'The Nomad buys small, buys directly, and pays workshops upfront. Who runs it, how it works, and where it has been since 2024.',
  alternates: { canonical: '/about' },
  openGraph: { url: '/about', type: 'website', siteName: 'The Nomad' },
};

const INK = '#111111';
const MUTED = '#6B6B68';
const FAINT = '#B4B0A6';
const LINE = '#E8E8E5';

// The "Where we are" panel used to be near-black. On the sage it now carries,
// the old #8A8A85 / #C9C9C4 / #E8E8E5 text colours score 2.98:1, 1.5:1 and
// 1.2:1 against it — all far under AA — so each is replaced, not just nudged.
const PANEL = '#E8F0E6';
const PANEL_MUTED = '#5A5A57';
const PANEL_LINE = '#CBD8C7';

// The accent stripe over each principle, from the design's own swatch list.
const POPS = ['#F6E3A1', '#F0D3BE', '#D8E2CE', '#CFDDE8', '#EAD6DF', '#E4DCC3'];

const arr = (v) => (Array.isArray(v) ? v : []);

const kickerStyle = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 22,
};

export default async function AboutPage() {
  const a = await getAbout();

  if (!a) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '140px 40px' }}>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 46, margin: '0 0 16px' }}>
          About
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: MUTED }}>
          This page has not been written yet.
        </p>
      </main>
    );
  }

  const stats = arr(a.stats);
  const bio = arr(a.founder_bio);
  const facts = arr(a.founder_facts);
  const principles = arr(a.principles);
  const timeline = arr(a.timeline);

  return (
    <main>
      {/* ── Header band ── */}
      <section
        style={{
          background: '#EEECE6',
          // Runs the band up behind the floating header pill instead of
          // leaving the pill's reserved strip showing as white. See lib/nav.js.
          marginTop: -NAV_RESERVE,
          padding: `${88 + NAV_RESERVE}px 40px 80px`,
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={kickerStyle}>{a.kicker}</div>
          <h1
            className="serif"
            style={{
              fontWeight: 300,
              // "A shop that started as a suitcase" has no long words, but the
              // headline is editable, so this clamps rather than trusting it.
              fontSize: 'clamp(40px, 8.6vw, 82px)',
              lineHeight: 1,
              margin: '0 0 26px',
              maxWidth: '16ch',
            }}
          >
            {a.headline}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.85, color: '#4A4A47', maxWidth: '60ch', margin: 0 }}>
            {a.intro}
          </p>
          {stats.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 64,
                flexWrap: 'wrap',
                marginTop: 56,
                paddingTop: 36,
                borderTop: '1px solid #DEDBD3',
              }}
            >
              {stats.map((s, i) => (
                <div key={`${s.label}-${i}`}>
                  <div className="serif" style={{ fontSize: 46, lineHeight: 1, fontWeight: 300 }}>
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: MUTED,
                      marginTop: 10,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── The founder ── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 40px 0' }}>
        <div
          className="split"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 72, alignItems: 'start' }}
        >
          <div>
            <div style={{ aspectRatio: '4/5', background: '#EDEAE3', overflow: 'hidden' }}>
              {a.founder_photo_id ? (
                <img
                  src={img(a.founder_photo_id, 800)}
                  alt={a.founder_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                // No portrait yet. A labelled, calm placeholder beats a broken
                // image icon, and it tells whoever is editing what belongs here.
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 24,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: FAINT,
                  }}
                >
                  Portrait to come
                </div>
              )}
            </div>
            {a.founder_caption && (
              <div
                style={{
                  marginTop: 16,
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: FAINT,
                }}
              >
                {a.founder_caption}
              </div>
            )}
          </div>

          <div>
            <div style={kickerStyle}>{a.founder_kicker}</div>
            <h2
              className="serif"
              style={{ fontWeight: 300, fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.05, margin: '0 0 10px' }}
            >
              {a.founder_name}
            </h2>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 34 }}>{a.founder_role}</div>
            {a.founder_quote && (
              <blockquote
                className="serif"
                style={{
                  margin: '0 0 34px',
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  color: INK,
                  maxWidth: '26ch',
                }}
              >
                “{a.founder_quote}”
              </blockquote>
            )}
            {bio.map((p, i) => (
              <p
                key={i}
                style={{ fontSize: 15, lineHeight: 1.85, color: '#4A4A47', margin: '0 0 20px', maxWidth: '56ch' }}
              >
                {p}
              </p>
            ))}
            {facts.length > 0 && (
              <div
                className="grid-2"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                  background: LINE,
                  marginTop: 38,
                  borderTop: `1px solid ${LINE}`,
                  borderBottom: `1px solid ${LINE}`,
                }}
              >
                {facts.map((f, i) => (
                  <div key={`${f.k}-${i}`} style={{ background: '#FFFFFF', padding: '22px 24px 24px' }}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: FAINT,
                        marginBottom: 9,
                      }}
                    >
                      {f.k}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' }}>{f.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How we work ── */}
      {principles.length > 0 && (
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
              {a.principles_title}
            </h2>
            {a.principles_note && (
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED }}>
                {a.principles_note}
              </div>
            )}
          </div>
          <div
            className="grid-4"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(principles.length, 4)},1fr)`,
              gap: 1,
              background: LINE,
              border: `1px solid ${LINE}`,
            }}
          >
            {principles.map((p, i) => (
              <div
                key={`${p.title}-${i}`}
                style={{ background: '#FFFFFF', padding: '44px 36px 48px', minHeight: 280 }}
              >
                <div style={{ width: 26, height: 2, background: POPS[i % POPS.length], marginBottom: 26 }} />
                <div className="serif" style={{ fontSize: 28, lineHeight: 1.25, marginBottom: 16 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.75, color: '#4A4A47' }}>{p.body}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Where we are ── */}
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '110px 40px 0' }}>
        <div
          className="split"
          style={{
            background: PANEL,
            color: INK,
            padding: 'clamp(40px, 6vw, 80px) clamp(26px, 4.5vw, 64px)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(36px, 5vw, 80px)',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ ...kickerStyle, color: PANEL_MUTED, marginBottom: 24 }}>{a.where_kicker}</div>
            <div
              className="serif"
              style={{ fontSize: 'clamp(28px, 4.2vw, 44px)', lineHeight: 1.3, marginBottom: 26 }}
            >
              {a.where_headline}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: '#4A4A47', maxWidth: '44ch' }}>
              {a.where_body}
            </div>
          </div>
          {timeline.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {timeline.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 24,
                    padding: '20px 0',
                    borderBottom: `1px solid ${PANEL_LINE}`,
                  }}
                >
                  <div style={{ fontSize: 15, lineHeight: 1.6, color: '#4A4A47', maxWidth: '38ch' }}>
                    {t.text}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: PANEL_MUTED,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.year}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
