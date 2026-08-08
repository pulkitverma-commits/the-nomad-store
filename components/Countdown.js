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

export default function Countdown({ size = 44 }) {
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
    <div style={{ display: 'flex', gap: size > 60 ? 56 : 44 }}>
      {parts.map(([v, l]) => (
        <div key={l}>
          <div className="serif" style={{ fontSize: size, lineHeight: 1 }} suppressHydrationWarning>
            {now ? v : '00'}
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#8A8A85',
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
