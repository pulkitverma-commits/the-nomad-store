import AccountOverviewClient from './AccountOverviewClient';

export const metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountOverviewClient />;
}
