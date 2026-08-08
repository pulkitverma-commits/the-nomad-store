export function inr(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

export const CLOUDINARY_CLOUD =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'gt3oqaa1';

// Cloudinary delivery URL from a public_id (e.g. "nomad/1577576223085-...")
export function cld(publicId, w = 800) {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/w_${w},c_fill,q_auto,f_auto/${publicId}`;
}

// Legacy helper: photo_id -> Cloudinary (all prototype images live under nomad/<photo_id>)
export function img(photoId, w = 800) {
  return cld(`nomad/${photoId}`, w);
}

// Product image: prefers admin-uploaded image_public_id, falls back to photo_id
export function productImg(p, w = 800) {
  if (p.image_public_id) return cld(p.image_public_id, w);
  return img(p.photo_id, w);
}

// The public_id behind a product, whichever column it happens to live in.
export function productPublicId(p) {
  return p.image_public_id || `nomad/${p.photo_id}`;
}

// Detail tile. If a second photograph has been uploaded we use that as-is;
// otherwise we ask Cloudinary for a genuine content-aware crop of the same
// negative (g_auto picks the subject) rather than faking a zoom in CSS.
export function productDetailImg(p, w = 600) {
  if (p.detail_public_id) return cld(p.detail_public_id, w);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/w_${w},h_${w},c_crop,g_auto,z_1.6/q_auto,f_auto/${productPublicId(p)}`;
}

export const MAPTILER_KEY =
  process.env.NEXT_PUBLIC_MAPTILER_KEY || 'Zarnd4HdiakX7HdqsByF';

// MapTiler's rendered "static map" endpoint answers 403 on this key
// ("Access to rendered maps not allowed" — it is not on the free plan), but the
// raster tile endpoint is fine. So we assemble the same picture from a 3x3
// block of tiles and offset it so the coordinate sits dead centre. Tiles are
// requested @2x and drawn at MAP_TILE css pixels, which keeps them crisp.
export const MAP_TILE = 256;

export function mapTiles(lat, lon, zoom = 12, style = 'landscape') {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  const fx = ((lon + 180) / 360) * n;
  const fy = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  const bx = Math.floor(fx);
  const by = Math.floor(fy);
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ty = by + dy;
      if (ty < 0 || ty >= n) continue;
      const tx = (((bx + dx) % n) + n) % n;
      tiles.push({
        key: `${dx}_${dy}`,
        left: (dx + 1) * MAP_TILE,
        top: (dy + 1) * MAP_TILE,
        url: `https://api.maptiler.com/maps/${style}/${MAP_TILE}/${zoom}/${tx}/${ty}@2x.png?key=${MAPTILER_KEY}`,
      });
    }
  }
  return {
    tiles,
    size: MAP_TILE * 3,
    pointX: (fx - (bx - 1)) * MAP_TILE, // where the coordinate falls inside the block
    pointY: (fy - (by - 1)) * MAP_TILE,
  };
}

export function deg(v, pos, neg) {
  return Math.abs(v).toFixed(4) + '° ' + (v >= 0 ? pos : neg);
}

export function proj(lat, lon) {
  return {
    left: (((lon + 120) / 280) * 100).toFixed(2) + '%',
    top: (((65 - lat) / 110) * 100).toFixed(2) + '%',
  };
}

export function countrySlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function stockNote(stock) {
  return stock <= 0 ? 'Sold out' : stock <= 4 ? stock + ' remaining' : '';
}

export function stockLine(stock) {
  if (stock <= 0) return 'Sold out — gone for good';
  return stock <= 4
    ? stock + ' remaining from this collection'
    : 'In stock · ships in 2–3 days';
}

// COUNTRY_COPY used to live here with a single hand-written Japan entry. It has
// moved into the `countries` table (see app/country/[slug]/page.js), which now
// carries a row for all eighteen. Nothing else referenced it.
//
// COUNTRY_PHOTOS stays: app/page.js still uses it for the homepage country rail.
export const COUNTRY_PHOTOS = {
  japan: '1520408222757-6f9f95d87d5d',
  portugal: '1614807254023-133d1a7a3c41',
  'south-korea': '1654931800100-2ecf6eee7c64',
  turkiye: '1615892438475-694629f05c7b',
  't-rkiye': '1615892438475-694629f05c7b',
  morocco: '1523350165414-082d792c4bcc',
  italy: '1562195168-c82fea0f0953',
  france: '1511968822213-92de73315bba',
  netherlands: '1501927023255-9063be98970c',
};
