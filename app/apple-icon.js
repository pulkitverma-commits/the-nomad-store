import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Same geometry as app/icon.svg, drawn on its own ink field.
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
  '<g fill="#FCF7E8">' +
  '<rect x="4" y="12" width="24" height="8"/>' +
  '<rect x="12" y="12" width="8" height="40"/>' +
  '<rect x="32" y="12" width="8" height="40"/>' +
  '<rect x="52" y="12" width="8" height="40"/>' +
  '<polygon points="32,12 40,12 60,52 52,52"/>' +
  '</g></svg>';

const MARK_SRC = 'data:image/svg+xml;base64,' + Buffer.from(MARK).toString('base64');

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
        }}
      >
        {/* Inset well clear of the corners iOS rounds away. */}
        <img src={MARK_SRC} width={130} height={130} alt="" />
      </div>
    ),
    size
  );
}
