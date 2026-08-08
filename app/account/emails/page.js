import EmailsClient from './EmailsClient';

export const metadata = {
  title: 'Letters',
  robots: { index: false, follow: false },
};

export default function EmailsPage() {
  return <EmailsClient />;
}
