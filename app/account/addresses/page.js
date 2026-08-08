import AddressesClient from './AddressesClient';

export const metadata = {
  title: 'Addresses',
  robots: { index: false, follow: false },
};

export default function AddressesPage() {
  return <AddressesClient />;
}
