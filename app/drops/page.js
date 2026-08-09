import { getDrops } from '@/lib/supabase';
import Countdown from '@/components/Countdown';
import SubscribeForm from '@/components/SubscribeForm';

export const revalidate = 60;

// Each drop row carries its size in the free-text note — "24 objects · ceramics,
// cork, tile". Read the leading number if there is one and count the row as zero
// if there is not, rather than putting NaN on the page.
function objectsIn(note) {
  const match = /^\s*(\d+)/.exec(String(note ?? ''));
  return match ? parseInt(match[1], 10) : 0;
}

const NUMBER_WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
];

// Spelled out to match the rest of the copy; digits once we run out of words.
function inWords(n) {
  return NUMBER_WORDS[n] || String(n);
}

export const metadata = {
  title: 'Nomad Drops — One Trip, Released All at Once',
  description:
    'A Nomad drop is one collection trip released in one moment: limited handcrafted objects, nothing restocked, nothing discounted. Join the list for Drop 006 — Tokyo.',
};

export default async function DropsPage() {
  const drops = await getDrops();
  const released = drops.length;
  const objectCount = drops.reduce((total, d) => total + objectsIn(d.note), 0);
  return (
    <main>
      <section style={{ background: '#E8F0E6', color: '#111111', padding: '110px 40px' }}>
        <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#5A5A57', marginBottom: 26 }}>
            Nomad Drops
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 96, lineHeight: 0.95, margin: '0 0 26px', maxWidth: '16ch' }}>
            We release what we find, all at once
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#4A4A47', maxWidth: '56ch', margin: '0 0 60px' }}>
            A drop is one trip, released in one moment. Nothing is restocked, nothing is discounted.
            Join the list and we will write to you the morning it opens.
          </p>
          <div
            className="split"
            style={{
              borderTop: '1px solid #CBD8C7',
              paddingTop: 48,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 60,
              alignItems: 'end',
            }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#5A5A57', marginBottom: 20 }}>
                Drop 006 · Tokyo · 28 objects
              </div>
              <Countdown size={76} />
            </div>
            <div style={{ minWidth: 'min(400px, 100%)' }}>
              <SubscribeForm source="drops" cta="Join the list →" />
            </div>
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1560, margin: '0 auto', padding: '96px 40px 0' }}>
        <div
          style={{
            borderBottom: '1px solid #E8E8E5',
            paddingBottom: 24,
            marginBottom: 44,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 44, margin: 0 }}>Previous drops</h2>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6B68' }}>
            {`${inWords(released)} released · ${objectCount} objects`}
          </div>
        </div>
        {drops.map((d) => (
          <div
            key={d.drop_no}
            className="drop-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1.2fr 1fr auto',
              gap: 40,
              alignItems: 'center',
              padding: '28px 0',
              borderBottom: '1px solid #F2F1ED',
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6' }}>
              {d.drop_no}
            </div>
            <div className="serif" style={{ fontSize: 32 }}>{d.city}</div>
            <div style={{ fontSize: 13, color: '#6B6B68' }}>{d.note}</div>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B4B0A6' }}>
              {d.status}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
