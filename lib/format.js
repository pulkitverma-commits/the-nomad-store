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

export const COUNTRY_COPY = {
  Japan: {
    quote: '“A country where a soy dish is designed with the same seriousness as a building.”',
    body: 'We have made four collection trips to Japan. What comes back is rarely decorative — it is almost always something meant to be used daily, made well enough to outlive the person who bought it. Ceramics from Kyoto, brass and steel from Osaka and Tokyo, cedar from Nara.',
    heroPhoto: '1609881583302-61548332039c',
    heroCaption: 'Kyoto — a workshop off Nishiki',
  },
};

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
