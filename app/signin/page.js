import { Suspense } from 'react';
import SignInClient from './SignInClient';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to The Nomad to see your orders, the objects you have collected and the letters you get from us.',
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  // useSearchParams needs a Suspense boundary for the static build.
  return (
    <Suspense fallback={null}>
      <SignInClient />
    </Suspense>
  );
}
