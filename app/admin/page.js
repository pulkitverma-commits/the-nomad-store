import AdminApp from '@/components/admin/AdminApp';

export const metadata = {
  title: 'Admin — The Nomad',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
