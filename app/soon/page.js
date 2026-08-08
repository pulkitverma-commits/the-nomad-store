import { getComingSoon } from '@/lib/supabase';
import NotifyButton from '@/components/NotifyButton';

export const revalidate = 60;

export const metadata = {
  title: 'Coming Home Soon — Objects in Transit',
  description:
    'Handcrafted objects we have already bought, packed and shipped — currently somewhere between a workshop and a Mumbai customs shed. Get notified when they arrive in India.',
};

export default async function SoonPage() {
  const soon = await getComingSoon();
  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '70px 40px 0' }}>
      <div style={{ borderBottom: '1px solid #E8E8E5', paddingBottom: 40, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6B6B68', marginBottom: 20 }}>
          In transit
        </div>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 76, lineHeight: 1, margin: '0 0 18px' }}>
          Coming Home Soon
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6B6B68', maxWidth: '54ch', margin: 0 }}>
          Objects we have already bought, packed and shipped — currently somewhere between a workshop
          and a Mumbai customs shed.
        </p>
      </div>
      {soon.map((s) => (
        <div
          key={s.obj_no}
          className="split"
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr auto auto',
            gap: 44,
            alignItems: 'center',
            padding: '32px 0',
            borderBottom: '1px solid #F2F1ED',
          }}
        >
          <div style={{ aspectRatio: '1', background: '#F2F1ED' }} />
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 10 }}>
              {s.obj_no}
            </div>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1.15 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: '#6B6B68', marginTop: 8 }}>{s.origin}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#B4B0A6', marginBottom: 8 }}>
              Arriving in India
            </div>
            <div style={{ fontSize: 14 }}>{s.eta}</div>
          </div>
          <NotifyButton itemName={s.name} boxed />
        </div>
      ))}
    </main>
  );
}
