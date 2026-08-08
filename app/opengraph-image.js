import { ImageResponse } from 'next/og';

export const alt = 'The Nomad — Collectibles Worth Bringing Home';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The monogram, kept as a string so the card carries its own mark rather than
// reaching for a file at render time. Same geometry as app/icon.svg.
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
  '<rect width="64" height="64" fill="#111111"/>' +
  '<g fill="#FCF7E8">' +
  '<rect x="4" y="12" width="24" height="8"/>' +
  '<rect x="12" y="12" width="8" height="40"/>' +
  '<rect x="32" y="12" width="8" height="40"/>' +
  '<rect x="52" y="12" width="8" height="40"/>' +
  '<polygon points="32,12 40,12 60,52 52,52"/>' +
  '</g></svg>';

const MARK_SRC = 'data:image/svg+xml;base64,' + Buffer.from(MARK).toString('base64');

// Google serves a plain .ttf to a user agent it does not recognise as a modern
// browser, which is the only format satori will take. We ask the CSS API for the
// current file and keep a known-good pinned URL behind it; if neither answers we
// render in the default face rather than failing the route.
const FONT_FALLBACK = {
  serif:
    'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_qE6GnM.ttf',
  sans:
    'https://fonts.gstatic.com/s/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSTF-Qf1.ttf',
};

async function ttf(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // A real face is hundreds of kilobytes; anything tiny is an error page.
    return buf.byteLength > 20000 ? buf : null;
  } catch (e) {
    return null;
  }
}

async function googleFont(family, weight, fallbackUrl) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
    ).then((r) => (r.ok ? r.text() : ''));
    const found = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/);
    if (found) {
      const data = await ttf(found[1]);
      if (data) return data;
    }
  } catch (e) {}
  return ttf(fallbackUrl);
}

// Fetched once at module scope and shared by every render of this route.
const fontsPromise = Promise.all([
  googleFont('Cormorant+Garamond', 300, FONT_FALLBACK.serif),
  googleFont('Instrument+Sans', 400, FONT_FALLBACK.sans),
]);

export default async function Image() {
  const [serif, sans] = await fontsPromise;

  const loaded = [];
  if (serif) loaded.push({ name: 'Cormorant', data: serif, weight: 300, style: 'normal' });
  if (sans) loaded.push({ name: 'Instrument', data: sans, weight: 400, style: 'normal' });
  // An empty list is not the same as no list: satori refuses to lay anything out
  // with zero faces, so we hand the option over only when we actually have one.
  const opts = loaded.length ? { ...size, fonts: loaded } : { ...size };

  const serifFamily = serif ? 'Cormorant' : 'sans-serif';
  const sansFamily = sans ? 'Instrument' : 'sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FCF7E8',
          color: '#111111',
          fontFamily: sansFamily,
          padding: '74px 76px 62px',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={MARK_SRC} width={46} height={46} alt="" />
            <div
              style={{
                fontSize: 17,
                letterSpacing: '0.42em',
                textTransform: 'uppercase',
                marginLeft: 22,
              }}
            >
              The Nomad
            </div>
          </div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#B4B0A6',
            }}
          >
            Est. 2026
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
          <div
            style={{
              fontSize: 15,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#6B6B68',
              marginBottom: 30,
            }}
          >
            Eighteen countries · one small collection
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontFamily: serifFamily,
              fontWeight: 300,
              fontSize: serif ? 116 : 84,
              lineHeight: 1.02,
              letterSpacing: serif ? '-0.01em' : '-0.025em',
            }}
          >
            <div style={{ display: 'flex' }}>Collectibles Worth</div>
            <div style={{ display: 'flex' }}>Bringing Home</div>
          </div>
        </div>

        {/* Subline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            borderTop: '1px solid #E8E8E5',
            paddingTop: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              lineHeight: 1.55,
              color: '#6B6B68',
              maxWidth: 640,
            }}
          >
            A collection of remarkable objects discovered across cities, cultures and corners of
            the world — brought home to India.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 13,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#B4B0A6',
              paddingBottom: 6,
            }}
          >
            Hand-carried
          </div>
        </div>

        {/* Sand rule, the one warm note the site opens with */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 1200,
            height: 14,
            background: '#F2E38F',
          }}
        />
      </div>
    ),
    opts
  );
}
