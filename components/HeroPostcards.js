'use client';
import { useState } from 'react';
import { img } from '@/lib/format';

// Postcards from collection trips — clicking the top card sends it to the
// back of the stack (yuzu.so-style shuffle) and reveals the next one.
const CARDS = [
  {
    photo: '1607556672044-6110fc499247',
    caption: 'Kyoto, 06:40 — the morning we found the matcha bowls',
    no: 'Postcard № 006',
  },
  {
    photo: '1585208798174-6cedd86e019a',
    caption: 'Lisbon — the Graça rooftops, an hour before the flea market',
    no: 'Postcard № 005',
  },
  {
    photo: '1541471943749-e5976783f6c3',
    caption: 'Istanbul — the Grand Bazaar, before the shutters open',
    no: 'Postcard № 004',
  },
  {
    photo: '1590605105526-5c08f63f89aa',
    caption: 'Seoul — Euljiro at dusk, looking for the aluminium studio',
    no: 'Postcard № 003',
  },
  {
    photo: '1611758497398-5224931d155a',
    caption: 'Tokyo — Nakameguro in February, the letterpress week',
    no: 'Postcard № 002',
  },
];

// resting poses for each depth in the stack (top first)
const POSES = [
  { rot: -2, x: 0, y: 0, scale: 1 },
  { rot: 2.5, x: 14, y: -10, scale: 0.985 },
  { rot: -4.5, x: -18, y: -18, scale: 0.97 },
  { rot: 4, x: 10, y: -26, scale: 0.955 },
  { rot: -1.5, x: -6, y: -32, scale: 0.94 },
];

export default function HeroPostcards() {
  const [order, setOrder] = useState(CARDS.map((_, i) => i));
  const [leaving, setLeaving] = useState(null);

  const shuffle = () => {
    if (leaving !== null) return;
    const top = order[0];
    setLeaving(top);
    setTimeout(() => {
      setOrder((o) => [...o.slice(1), o[0]]);
      setLeaving(null);
    }, 420);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div
        onClick={shuffle}
        style={{ position: 'relative', height: 484, cursor: 'pointer' }}
        title="Flip through the postcards"
      >
        {order.map((cardIdx, depth) => {
          const card = CARDS[cardIdx];
          const pose = POSES[Math.min(depth, POSES.length - 1)];
          const isLeaving = leaving === cardIdx;
          // While the top card slides out, everyone behind moves up one slot.
          const effective = leaving !== null && !isLeaving ? POSES[Math.max(0, depth - 1)] : pose;
          return (
            <div
              key={card.photo}
              style={{
                position: 'absolute',
                inset: 0,
                background: '#FFFDF4',
                padding: '16px 16px 0',
                borderRadius: 6,
                boxShadow:
                  depth === 0
                    ? '0 24px 60px rgba(17,17,17,0.18)'
                    : '0 12px 32px rgba(17,17,17,0.12)',
                transform: isLeaving
                  ? 'translateX(58%) rotate(9deg) scale(0.98)'
                  : `translate(${effective.x}px, ${effective.y}px) rotate(${effective.rot}deg) scale(${effective.scale})`,
                opacity: isLeaving ? 0 : 1,
                zIndex: 40 - depth,
                transition: 'transform .42s cubic-bezier(.3,.7,.3,1), opacity .42s ease, box-shadow .42s ease',
                willChange: 'transform',
              }}
            >
              <div style={{ height: 400, overflow: 'hidden' }}>
                <img
                  src={img(card.photo, 1200)}
                  alt={card.caption}
                  loading={depth === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 20,
                  padding: '16px 8px',
                }}
              >
                <div className="serif" style={{ fontStyle: 'italic', fontSize: 20, color: '#4A4A47' }}>
                  {card.caption}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: '#B4B0A6',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.no}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: 26,
          fontSize: 10,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: '#6B6B68',
        }}
      >
        Click the postcard to flip through the trip · {order[0] + 1} / {CARDS.length}
      </div>
    </div>
  );
}
