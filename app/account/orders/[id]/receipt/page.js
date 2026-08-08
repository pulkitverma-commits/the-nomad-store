import ReceiptClient from './ReceiptClient';

export const metadata = {
  title: 'Receipt',
  robots: { index: false, follow: false },
};

export default function AccountReceiptPage({ params }) {
  return <ReceiptClient orderId={params.id} />;
}
