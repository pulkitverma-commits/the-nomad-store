'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  // The visitor gets none of this — but somebody debugging on a Tuesday will
  // want it in the console.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '70px 40px 0' }}>
      <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 38, marginBottom: 46 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#6B6B68',
            marginBottom: 22,
          }}
        >
          Something went wrong
        </div>
        <h1
          className="serif"
          style={{ fontWeight: 300, fontSize: 66, lineHeight: 1.02, margin: '0 0 22px' }}
        >
          This page did not load
        </h1>
        <p
          className="serif"
          style={{
            fontSize: 23,
            lineHeight: 1.6,
            fontStyle: 'italic',
            color: '#4A4A47',
            margin: 0,
            maxWidth: '34ch',
          }}
        >
          It is our end, not yours. Nothing you did caused it and nothing has been lost.
        </p>
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.9, color: '#4A4A47', margin: '0 0 34px' }}>
        Most of the time a second attempt is enough — the page asks again and everything is where it
        should be. If it happens twice, we have already been told, and one of us will look at it.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => reset()}
          className="btn-dark"
          style={{
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '17px 26px',
            fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
        <Link
          href="/shop"
          className="underline-link"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          Back to the objects →
        </Link>
      </div>

      <div style={{ marginTop: 54, paddingTop: 26, borderTop: '1px solid #E8E8E5' }}>
        <div
          className="serif"
          style={{ fontStyle: 'italic', fontSize: 17, color: '#6B6B68', lineHeight: 1.6 }}
        >
          If it keeps happening, write to{' '}
          <a href="mailto:hype@thenomad.buzz" className="muted-link">hype@thenomad.buzz</a> and
          tell us what you were trying to reach.
        </div>
      </div>
      <div style={{ height: 110 }} />
    </main>
  );
}
