import CollectionClient from './CollectionClient';

export const metadata = {
  title: 'Your collection',
  robots: { index: false, follow: false },
};

// Everything under /account is drawn in the browser: the session lives there,
// so a server component would only ever see a signed-out visitor.
export default function CollectionPage() {
  return <CollectionClient />;
}
