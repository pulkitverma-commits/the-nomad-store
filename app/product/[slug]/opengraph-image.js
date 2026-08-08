import { ImageResponse } from 'next/og';
import { getProduct } from '@/lib/supabase';
import { inr, productPublicId, CLOUDINARY_CLOUD } from '@/lib/format';

export const alt = 'An object from The Nomad';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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

const PHOTO_W = 480;

// The site delivers f_auto, which hands back WebP or AVIF. Satori will not
// decode either, so this route asks Cloudinary for a plain JPEG of the same
// negative, cropped to the panel it has to fill.
function ogPhoto(p) {
  return (
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/` +
    `w_720,h_945,c_fill,q_auto,f_jpg/${productPublicId(p)}`
  );
}

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

const fontsPromise = Promise.all([
  googleFont('Cormorant+Garamond', 300, FONT_FALLBACK.serif),
  googleFont('Instrument+Sans', 400, FONT_FALLBACK.sans),
]);

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img src={MARK_SRC} width={34} height={34} alt="" />
      <div
        style={{
          fontSize: 13,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          marginLeft: 16,
        }}
      >
        The Nomad
      </div>
    </div>
  );
}

export default async function Image({ params }) {
  const [serif, sans] = await fontsPromise;

  const loaded = [];
  if (serif) loaded.push({ name: 'Cormorant', data: serif, weight: 300, style: 'normal' });
  if (sans) loaded.push({ name: 'Instrument', data: sans, weight: 400, style: 'normal' });
  // An empty list is not the same as no list: satori refuses to lay anything out
  // with zero faces, so we hand the option over only when we actually have one.
  const opts = loaded.length ? { ...size, fonts: loaded } : { ...size };

  const serifFamily = serif ? 'Cormorant' : 'sans-serif';
  const sansFamily = sans ? 'Instrument' : 'sans-serif';

  let p = null;
  try {
    p = await getProduct(params.slug);
  } catch (e) {
    p = null;
  }

  // An object we cannot find still deserves a card that looks like us.
  if (!p) {
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
          <Wordmark />
          <div
            style={{
              display: 'flex',
              fontFamily: serifFamily,
              fontWeight: 300,
              fontSize: serif ? 104 : 76,
              lineHeight: 1.02,
              letterSpacing: '-0.01em',
            }}
          >
            Collectibles Worth Bringing Home
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 13,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#B4B0A6',
            }}
          >
            Eighteen countries · hand-carried
          </div>
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

  // ₹ is drawn by Cormorant but not by the fallback face, so we spell the
  // currency out if the serif never arrived.
  const price = serif ? inr(p.price) : 'INR ' + Number(p.price).toLocaleString('en-IN');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#FCF7E8',
          color: '#111111',
          fontFamily: sansFamily,
        }}
      >
        {/* The photograph, as it was found */}
        <div
          style={{
            display: 'flex',
            width: PHOTO_W,
            height: 630,
            background: p.tone || '#F2F1ED',
          }}
        >
          <img
            src={ogPhoto(p)}
            width={PHOTO_W}
            height={630}
            alt=""
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* The label */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 1200 - PHOTO_W,
            height: 630,
            padding: '62px 64px 62px',
          }}
        >
          <Wordmark />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 13,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: '#B4B0A6',
                marginBottom: 22,
              }}
            >
              {p.object_no}
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: serifFamily,
                fontWeight: 300,
                fontSize: serif ? 72 : 54,
                lineHeight: 1.06,
                letterSpacing: '-0.005em',
                marginBottom: 24,
              }}
            >
              {p.name}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 15,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#6B6B68',
              }}
            >
              {`${p.city} · ${p.country}`}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              borderTop: '1px solid #E8E8E5',
              paddingTop: 28,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: serifFamily,
                fontWeight: 300,
                fontSize: 46,
                lineHeight: 1,
              }}
            >
              {price}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#B4B0A6',
                paddingBottom: 6,
              }}
            >
              {p.material}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: PHOTO_W,
            bottom: 0,
            width: 1200 - PHOTO_W,
            height: 14,
            background: '#F2E38F',
          }}
        />
      </div>
    ),
    opts
  );
}
