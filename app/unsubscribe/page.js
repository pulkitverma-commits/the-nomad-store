import UnsubscribeClient from './UnsubscribeClient';

export const metadata = {
  title: 'Unsubscribe — The Nomad',
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return <UnsubscribeClient />;
}
