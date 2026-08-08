import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'Your orders',
  robots: { index: false, follow: false },
};

export default function AccountOrdersPage() {
  return <OrdersClient />;
}
