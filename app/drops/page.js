import { getDrops } from '@/lib/supabase';
import Countdown from '@/components/Countdown';
import SubscribeForm from '@/components/SubscribeForm';

export const revalidate = 60;

export const metadata = {
  title: 'Nomad Drops — One Trip, Released All at Once',
  description:
    'A Nomad drop is one collection trip released in one moment: limited handcrafted objects, nothing restocked, nothing discounted. Join the list for Drop 006 — Tokyo.',
};

export default async function DropsPage() {
  const drops = await getDrops();
  return (
    <main>
      <section style={{ background: '#111111', color: '#FFFFFF', padding: '110px 40px' }}>
        <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8A8A85', marginBottom: 26 }}>
            Nomad Drops
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 96, lineHeight: 0.95, margin: '0 0 26px', maxWidth: '16ch' }}>
            We release what we find, all at once
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#B4B0A6', maxWidth: '56ch', margin: '0 0 60px' }}>
            A drop is one trip, released in one moment. Nothing is restocked, nothing is discounted.
            Join the list and we will write to you the morning it opens.
          </p>
          <div
            className="split"
            style={{
              borderTop: '1px solid #333330',
              paddingTop: 48,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 60,
              alignItems: 'end',
            }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#8A8A85', marginBottom: 20 }}>
                Drop 006 · Tokyo · 28 objects
              </div>
              <Countdown size={76} />
            </div>
            <div style={{ minWidth: 'min(400px, 100%)' }}>
              <SubscribeForm source="drops" dark cta="Join the list →" />
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
          }}
        >
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 44, margin: 0 }}>Previous drops</h2>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B6B68' }}>
            Five released · 138 objects
          </div>
        </div>
        {drops.map((d) => (
          <div
            key={d.drop_no}
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
