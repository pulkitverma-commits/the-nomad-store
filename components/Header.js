'use client';
import Link from 'next/link';
import { useUi } from './Ui';
import { useCustomerSession } from '@/lib/customerAuth';

export default function Header() {
  const { bag, setBagOpen, setSearchOpen, saved, loaded } = useUi();
  const { session, loading: authLoading } = useCustomerSession();
  const count = bag.reduce((t, b) => t + b.qty, 0);
  // Only after localStorage has been read, so server HTML and first client
  // paint agree and the number does not flicker in.
  const savedCount = loaded ? saved.length : 0;
  return (
    <header style={{ position: 'sticky', top: 16, zIndex: 60, padding: '0 24px' }}>
      {/* Kept local rather than in globals.css so the pill bar owns its own
          breakpoint: below 640px the Saved link collapses to just the heart. */}
      <style>
        {'@media (max-width:640px){.saved-word{display:none}}' +
          '@media (max-width:560px){.account-link{display:none}}'}
      </style>
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
          <Link
            className="navlink"
            href="/saved"
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: savedCount > 0 ? '#111111' : '#B4B0A6' }}>
              {savedCount > 0 ? '♥' : '♡'}
            </span>
            <span className="saved-word">Saved</span>
            {savedCount > 0 ? <span>({savedCount})</span> : null}
          </Link>
          {/* Signed out this reads "Sign in"; signed in it becomes "Account".
              Held back until the session is known so the two do not swap in
              front of the reader on every page load. */}
          {!authLoading && (
            <Link
              className="navlink account-link"
              href={session ? '/account' : '/signin'}
              style={{ fontSize: 13.5, fontWeight: 500, padding: '10px 12px', whiteSpace: 'nowrap' }}
            >
              {session ? 'Account' : 'Sign in'}
            </Link>
          )}
          <div
            className="btn-dark"
            onClick={() => setBagOpen(true)}
            style={{
              borderRadius: 999,
              padding: '11px 22px',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Bag {count > 0 ? `(${count})` : ''}
          </div>
        </div>
      </div>
    </header>
  );
}
