'use client';
import { useEffect, useState } from 'react';

function nextDropTarget() {
  // Next Sunday 11:00 IST (UTC+5:30 => 05:30 UTC)
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 5, 30, 0));
  const day = t.getUTCDay();
  let add = (7 - day) % 7;
  if (add === 0 && t.getTime() <= now.getTime()) add = 7;
  t.setUTCDate(t.getUTCDate() + add);
  return t.getTime();
}

// `labelColor` exists because the DAYS/HOURS labels are 9px uppercase with wide
// letter-spacing — the first thing to become unreadable when the panel behind
// them changes. The old value (#8A8A85) was tuned for a near-black panel and
// scores 2.98:1 on the sage one, well under AA, so the caller says now.
export default function Countdown({ size = 44, labelColor = '#5A5A57' }) {
  const [now, setNow] = useState(null);
  const [target, setTarget] = useState(null);
  useEffect(() => {
    setTarget(nextDropTarget());
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = now && target ? Math.max(0, target - now) : 0;
  const pad = (n) => String(n).padStart(2, '0');
  const parts = [
    [pad(Math.floor(diff / 864e5)), 'Days'],
    [pad(Math.floor(diff / 36e5) % 24), 'Hours'],
    [pad(Math.floor(diff / 6e4) % 60), 'Minutes'],
    [pad(Math.floor(diff / 1e3) % 60), 'Seconds'],
  ];
  return (
    <div className="countdown" style={{ display: 'flex', flexWrap: 'wrap', gap: size > 60 ? 56 : 44 }}>
      {parts.map(([v, l]) => (
        <div key={l}>
          <div className="serif countdown-num" style={{ fontSize: size, lineHeight: 1 }} suppressHydrationWarning>
            {now ? v : '00'}
          </div>
          <div
            className="countdown-label"
            style={{
              fontSize: 9,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: labelColor,
              marginTop: 8,
            }}
          >
            {l}
          </div>
        </div>
      ))}
    </div>
  );
}
