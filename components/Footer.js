import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

const label = {
  fontSize: 10,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: '#B4B0A6',
  marginBottom: 20,
};
const col = { display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13, color: '#4A4A47' };

export default function Footer() {
  return (
    <footer style={{ marginTop: 140, borderTop: '1px solid #E8E8E5', background: '#FFFFFF' }}>
      <div
        className="split"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          padding: '80px 40px 40px',
          display: 'grid',
          gridTemplateColumns: '1.4fr repeat(3,1fr) 1.5fr',
          gap: 56,
        }}
      >
        <div>
          <div style={{ fontSize: 14, letterSpacing: '0.42em', textTransform: 'uppercase', marginBottom: 18 }}>
            The Nomad
          </div>
          <div className="serif" style={{ fontStyle: 'italic', fontSize: 20, color: '#6B6B68' }}>
            Collectibles worth bringing home.
          </div>
        </div>
        <div>
          <div style={label}>Shop</div>
          <div style={col}>
            <Link href="/shop">New</Link>
            <Link href="/shop">Objects</Link>
            <Link href="/country/japan">Countries</Link>
            <Link href="/gifts">Gifts</Link>
          </div>
        </div>
        <div>
          <div style={label}>Explore</div>
          <div style={col}>
            <Link href="/journal">Journal</Link>
            <Link href="/world">World Map</Link>
            <Link href="/drops">Nomad Drops</Link>
            <Link href="/soon">Coming Home Soon</Link>
            <Link href="/voices">Voices</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
        <div>
          <div style={label}>Help</div>
          <div style={col}>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faqs">FAQs</Link>
            <Link href="/saved">Saved objects</Link>
          </div>
        </div>
        <div>
          <div style={label}>Postcards From The Nomad</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: '#6B6B68', marginBottom: 22 }}>
            Occasional discoveries from around the world. No more than twice a month.
          </div>
          <SubscribeForm source="newsletter" dark={false} />
        </div>
      </div>
      <div
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          padding: '0 40px 44px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          letterSpacing: '0.12em',
          color: '#B4B0A6',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>© 2026 The Nomad · New Delhi</div>
        <div style={{ display: 'flex', gap: 26 }}>
          <span>Instagram</span>
          <span>Pinterest</span>
          <Link href="/terms" style={{ color: '#B4B0A6' }}>Terms</Link>
          <Link href="/privacy" style={{ color: '#B4B0A6' }}>Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
