// Shared shell for the policy / help pages (shipping, returns, contact, faqs,
// terms, privacy). Server component — no interactivity anywhere in here.
import Link from 'next/link';

export const kicker = {
  fontSize: 10,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: '#6B6B68',
  marginBottom: 22,
};

export function PolicyPage({ eyebrow = 'Help', title, lede, updated, children }) {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '70px 40px 0' }}>
      <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 38, marginBottom: 46 }}>
        <div style={kicker}>{eyebrow}</div>
        <h1
          className="serif"
          style={{ fontWeight: 300, fontSize: 66, lineHeight: 1.02, margin: '0 0 22px' }}
        >
          {title}
        </h1>
        {lede && (
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
            {lede}
          </p>
        )}
      </div>
      {children}
      <div
        style={{
          borderTop: '1px solid #E8E8E5',
          marginTop: 64,
          paddingTop: 26,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
          fontSize: 11,
          letterSpacing: '0.12em',
          color: '#B4B0A6',
        }}
      >
        <div>{updated ? `Last updated ${updated}` : 'The Nomad · New Delhi'}</div>
        <div style={{ display: 'flex', gap: 22 }}>
          <Link href="/shipping" style={{ color: '#B4B0A6' }}>Shipping</Link>
          <Link href="/returns" style={{ color: '#B4B0A6' }}>Returns</Link>
          <Link href="/faqs" style={{ color: '#B4B0A6' }}>FAQs</Link>
          <Link href="/contact" style={{ color: '#B4B0A6' }}>Contact</Link>
        </div>
      </div>
    </main>
  );
}

export function H({ children }) {
  return (
    <h2
      className="serif"
      style={{ fontWeight: 300, fontSize: 32, lineHeight: 1.2, margin: '52px 0 18px' }}
    >
      {children}
    </h2>
  );
}

export function P({ children }) {
  return (
    <p style={{ fontSize: 15, lineHeight: 1.9, color: '#4A4A47', margin: '0 0 20px' }}>
      {children}
    </p>
  );
}

export function Small({ children }) {
  return (
    <p style={{ fontSize: 13, lineHeight: 1.85, color: '#6B6B68', margin: '0 0 20px' }}>
      {children}
    </p>
  );
}

// Two-column key/value rows — used for delivery times, fees, what we store.
export function Rows({ rows }) {
  return (
    <div style={{ borderTop: '1px solid #E8E8E5', margin: '10px 0 28px' }}>
      {rows.map((r) => (
        <div
          key={r[0]}
          className="split"
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 24,
            padding: '16px 0',
            borderBottom: '1px solid #F2F1ED',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#B4B0A6',
              lineHeight: 1.7,
            }}
          >
            {r[0]}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: '#4A4A47' }}>{r[1]}</div>
        </div>
      ))}
    </div>
  );
}

export function Qa({ q, children }) {
  return (
    <div style={{ padding: '30px 0', borderBottom: '1px solid #F2F1ED' }}>
      <div className="serif" style={{ fontSize: 26, lineHeight: 1.3, margin: '0 0 14px' }}>
        {q}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.9, color: '#4A4A47' }}>{children}</div>
    </div>
  );
}

export function Pull({ children }) {
  return (
    <div
      className="serif"
      style={{
        borderTop: '1px solid #E8E8E5',
        borderBottom: '1px solid #E8E8E5',
        padding: '30px 0',
        margin: '44px 0',
        fontSize: 25,
        lineHeight: 1.5,
        fontStyle: 'italic',
        color: '#111111',
      }}
    >
      {children}
    </div>
  );
}
