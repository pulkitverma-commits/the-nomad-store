'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCustomerSession } from '@/lib/customerAuth';
import AccountNav from './AccountNav';

// The gate for everything under /account. Auth lives in the browser, so this
// has to be a client component; the layout stays a server component and just
// wraps its children in this.
export default function AccountShell({ children }) {
  const { session, loading } = useCustomerSession();
  const path = usePathname();

  // Nothing at all until we know — a flash of "please sign in" at somebody who
  // is already signed in reads as a bug.
  if (loading) return null;

  if (!session) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '110px 40px 0' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 22 }}>
          Your account
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 56, lineHeight: 1.05, margin: '0 0 24px' }}>
          Sign in to see it
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', margin: '0 0 36px', maxWidth: '54ch' }}>
          Orders, the objects you have collected, and the letters you get from us all live behind
          your email address. No password to remember — we send a link.
        </p>
        <Link
          href={`/signin?next=${encodeURIComponent(path)}`}
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Sign in →
        </Link>
        <div style={{ height: 140 }} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 40px 0' }}>
      <AccountNav />
      {children}
      <div style={{ height: 120 }} />
    </main>
  );
}
