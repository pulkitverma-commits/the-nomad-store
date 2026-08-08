'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { proj, countrySlug } from '@/lib/format';

export default function WorldMap({ cities, aspect = '2.2/1', dotSize = 24, big = false }) {
  const [hover, setHover] = useState(null);
  const router = useRouter();
  const hovered = hover ? cities.find((c) => c.city === hover) : null;
  const hovPos = hovered ? proj(hovered.lat, hovered.lon) : null;

  const lines = [];
  for (let i = 1; i < 14; i++)
    lines.push(
      <line key={'v' + i} x1={(i * 100) / 14} y1={0} x2={(i * 100) / 14} y2={100} stroke="#E4E2DB" strokeWidth="0.12" />
    );
  for (let j = 1; j < 8; j++)
    lines.push(
      <line key={'h' + j} x1={0} y1={(j * 100) / 8} x2={100} y2={(j * 100) / 8} stroke="#E4E2DB" strokeWidth="0.12" />
    );
  lines.push(
    <line
      key="eq"
      x1={0}
      y1={(65 / 110) * 100}
      x2={100}
      y2={(65 / 110) * 100}
      stroke="#D6D2C8"
      strokeWidth="0.25"
      strokeDasharray="1 1"
    />
  );

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: aspect }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {lines}
      </svg>
      {cities.map((c) => {
        const pos = proj(c.lat, c.lon);
        return (
          <div
            key={c.city}
            className="map-dot"
            onMouseEnter={() => setHover(c.city)}
            onMouseLeave={() => setHover(null)}
            onClick={() => router.push(`/country/${countrySlug(c.country)}`)}
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              width: dotSize,
              height: dotSize,
              margin: `-${dotSize / 2}px 0 0 -${dotSize / 2}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span />
          </div>
        );
      })}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            left: hovPos.left,
            top: hovPos.top,
            transform: 'translate(-50%,-140%)',
            background: '#111111',
            color: '#FFFFFF',
            padding: big ? '14px 18px' : '12px 16px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 5,
          }}
        >
          <div style={{ fontSize: big ? 13 : 12, letterSpacing: '0.12em' }}>
            {hovered.city}, {hovered.country}
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#8A8A85',
              marginTop: 5,
            }}
          >
            {hovered.count} {hovered.count === 1 ? 'object discovered' : 'objects discovered'}
          </div>
          {big && (
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginTop: 10,
              }}
            >
              Explore {hovered.city} →
            </div>
          )}
        </div>
      )}
    </div>
  );
}
