'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCustomerSession } from '@/lib/customerAuth';

const ITEMS = [
  ['/account', 'Overview'],
  ['/account/orders', 'Orders'],
  ['/account/collection', 'Your collection'],
  ['/account/saved', 'Saved objects'],
  ['/account/addresses', 'Addresses'],
  ['/account/emails', 'Letters'],
];

export default function AccountNav() {
  const path = usePathname();
  const { email, signOut } = useCustomerSession();

  return (
    <nav
      style={{
        borderBottom: '1px solid #E8E8E5',
        paddingBottom: 18,
        marginBottom: 48,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26 }}>
        {ITEMS.map(([href, text]) => {
          // /account itself must match exactly, or every child would light it up.
          const on = href === '/account' ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: on ? '#111111' : '#6B6B68',
                borderBottom: on ? '1px solid #111111' : '1px solid transparent',
                paddingBottom: 4,
              }}
            >
              {text}
            </Link>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontSize: 11, color: '#B4B0A6' }}>{email}</span>
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#6B6B68',
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
