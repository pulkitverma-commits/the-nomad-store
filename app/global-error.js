'use client';
import { useEffect } from 'react';

// Replaces the entire document when the root layout itself fails, so it renders
// its own <html> and <body> and can rely on nothing: no webfont, no globals.css,
// no header, no footer. Deliberately small, and still ours.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#FCF7E8',
          color: '#111111',
          fontFamily: 'Georgia, "Times New Roman", serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <main
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '120px 40px 80px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#6B6B68',
              marginBottom: 26,
            }}
          >
            The Nomad
          </div>
          <h1
            style={{
              fontWeight: 300,
              fontSize: 48,
              lineHeight: 1.05,
              margin: '0 0 20px',
            }}
          >
            The site is having a moment
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: '#4A4A47',
              margin: '0 0 34px',
            }}
          >
            Something failed before the page could be built. It is our end, not yours. Try again in
            a moment — and if it is still like this, write to{' '}
            <a
              href="mailto:hype@thenomad.buzz"
              style={{ color: '#111111', textDecoration: 'underline' }}
            >
              hype@thenomad.buzz
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: 'pointer',
              background: '#111111',
              color: '#FFFDF4',
              border: 'none',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '16px 26px',
              fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          <div style={{ marginTop: 44, fontSize: 13, color: '#6B6B68' }}>
            <a
              href="/"
              style={{
                color: '#6B6B68',
                textDecoration: 'none',
                borderBottom: '1px solid #E8E8E5',
                paddingBottom: 3,
              }}
            >
              Back to the beginning
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
