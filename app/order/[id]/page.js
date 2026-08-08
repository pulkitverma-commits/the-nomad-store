import OrderClient from './OrderClient';

export const metadata = {
  title: 'Order Confirmed',
  robots: { index: false },
};

export default function OrderPage({ params }) {
  return <OrderClient orderId={params.id} />;
}
