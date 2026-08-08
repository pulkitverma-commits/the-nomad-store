'use client';
import Link from 'next/link';
import { useUi } from './Ui';

export default function Header() {
  const { bag, setBagOpen, setSearchOpen } = useUi();
  const count = bag.reduce((t, b) => t + b.qty, 0);
  return (
    <header style={{ position: 'sticky', top: 16, zIndex: 60, padding: '0 24px' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          background: '#FFFDF4',
          border: '1px solid rgba(17,17,17,0.08)',
          borderRadius: 999,
          boxShadow: '0 12px 32px rgba(17,17,17,0.10)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 10px 0 30px',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 14,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          The Nomad
        </Link>
        <nav
          className="desktop-nav"
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 30,
            fontSize: 13.5,
            fontWeight: 500,
          }}
        >
          <Link className="navlink" href="/shop">Objects</Link>
          <Link className="navlink" href="/country/japan">Countries</Link>
          <Link className="navlink" href="/gifts">Gifts</Link>
          <Link className="navlink" href="/drops">Drops</Link>
          <Link className="navlink" href="/journal">Journal</Link>
          <Link className="navlink" href="/world">World Map</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <div
            className="navlink"
            onClick={() => setSearchOpen(true)}
            style={{ fontSize: 13.5, fontWeight: 500, padding: '10px 14px' }}
          >
            Search
          </div>
          <div
            className="btn-dark"
            onClick={() => setBagOpen(true)}
            style={{ borderRadius: 999, padding: '11px 24px', fontSize: 13, fontWeight: 600 }}
          >
            Bag {count > 0 ? `(${count})` : ''}
          </div>
        </div>
      </div>
    </header>
  );
}
