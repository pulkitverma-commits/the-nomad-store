import SavedAccountClient from './SavedAccountClient';

export const metadata = {
  title: 'Saved objects',
  robots: { index: false, follow: false },
};

// The public /saved page stays exactly as it is for visitors who are not
// signed in — kept in the browser, nothing sent to us. This is the same list
// once it has somewhere permanent to live.
export default function AccountSavedPage() {
  return <SavedAccountClient />;
}
