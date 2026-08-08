import LookupClient from './LookupClient';

export const metadata = {
  title: 'Find an order — The Nomad',
  robots: { index: false, follow: false },
};

export default function OrderLookupPage() {
  return <LookupClient />;
}
