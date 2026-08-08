import Link from 'next/link';

export default function SectionHead({ kicker, title, linkHref, linkLabel, right }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E8E8E5',
        paddingBottom: 26,
        marginBottom: 52,
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div>
        {kicker && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#6B6B68',
              marginBottom: 16,
            }}
          >
            {kicker}
          </div>
        )}
        <h2 className="serif" style={{ fontWeight: 300, fontSize: 46, lineHeight: 1, margin: 0 }}>
          {title}
        </h2>
      </div>
      {linkHref && (
        <Link
          href={linkHref}
          className="muted-link"
          style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}
        >
          {linkLabel}
        </Link>
      )}
      {right && (
        <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6B68' }}>
          {right}
        </div>
      )}
    </div>
  );
}
