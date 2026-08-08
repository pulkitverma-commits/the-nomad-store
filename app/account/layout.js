import AccountShell from '@/components/AccountShell';

export const metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }) {
  return <AccountShell>{children}</AccountShell>;
}
