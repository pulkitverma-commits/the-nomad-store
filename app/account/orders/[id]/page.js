import OrderDetailClient from './OrderDetailClient';

export const metadata = {
  title: 'Order',
  robots: { index: false, follow: false },
};

export default function AccountOrderPage({ params }) {
  return <OrderDetailClient orderId={params.id} />;
}
