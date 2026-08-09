import Link from 'next/link';

export const metadata = {
  title: 'Not found',
  robots: { index: false, follow: false },
};

// Four honest ways onward. Order-lookup sits last because the people who arrive
// here from a mistyped order link are the ones most likely to read that far.
const ways = [
  {
    href: '/shop',
    label: 'The shop',
    note: 'Everything currently on the shelf, from one country or all eighteen.',
  },
  {
    href: '/world',
    label: 'The world map',
    note: 'Every object has coordinates. This is where they came from.',
  },
  {
    href: '/journal',
    label: 'The journal',
    note: 'Notes from the collection trips — workshops, cities, long lunches.',
  },
  {
    href: '/order-lookup',
    label: 'Find an order',
    note: 'If you were looking for a parcel, the order number will fetch it.',
  },
];

export default function NotFound() {
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
          404 · Nothing at this address
        </div>
        <h1
          className="serif"
          style={{ fontWeight: 300, fontSize: 66, lineHeight: 1.02, margin: '0 0 22px' }}
        >
          This one we could not find
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
          Which is unusual for us, and easier to fix than most things we go looking for.
        </p>
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.9, color: '#4A4A47', margin: '0 0 44px' }}>
        The page may have moved, the address may have picked up a typo along the way, or the object
        that lived here has already gone home with somebody. Whichever it is, here is where to go
        instead.
      </p>

      <div style={{ borderTop: '1px solid #E8E8E5' }}>
        {ways.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            className="split"
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              gap: 24,
              padding: '22px 0',
              borderBottom: '1px solid #F2F1ED',
              alignItems: 'baseline',
            }}
          >
            <span className="serif" style={{ fontSize: 26, lineHeight: 1.3 }}>
              {w.label} →
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.8, color: '#6B6B68' }}>{w.note}</span>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 54, paddingTop: 26, borderTop: '1px solid #E8E8E5' }}>
        <div
          className="serif"
          style={{ fontStyle: 'italic', fontSize: 17, color: '#6B6B68', lineHeight: 1.6 }}
        >
          If you followed a link from us to get here, write to
          {' '}
          <a href="mailto:hype@thenomad.buzz" className="muted-link">hype@thenomad.buzz</a>
          {' '}
          and we will go and mend it.
        </div>
        <div style={{ marginTop: 22 }}>
          <Link
            href="/"
            className="underline-link"
            style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            Back to the beginning →
          </Link>
        </div>
      </div>
      <div style={{ height: 110 }} />
    </main>
  );
}
