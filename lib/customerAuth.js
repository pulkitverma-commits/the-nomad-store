'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from './supabaseBrowser';

// One place for "is somebody signed in, and who". Every account page reads
// this rather than talking to supabase.auth itself, so there is a single
// answer to what `undefined` means: we have not heard back yet, so render
// nothing rather than flashing a signed-out state at a signed-in person.
export function useCustomerSession() {
  const sb = supabaseBrowser();
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session ?? null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      // On sign-in, adopt any order sitting under this verified email without
      // an owner — everything bought as a guest before the account existed.
      // Best effort: history still resolves by email if this never lands.
      if (s) sb.rpc('claim_my_orders').then(() => {}, () => {});
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  return {
    session,
    loading: session === undefined,
    email: session?.user?.email || '',
    userId: session?.user?.id || '',
    signOut: () => sb.auth.signOut(),
  };
}

// The four social logins we have wired, in display order.
//  * LinkedIn's current provider is `linkedin_oidc` — plain `linkedin` is the
//    retired one and errors on new projects.
//  * Instagram has no provider of its own; Instagram Login runs through Meta,
//    so it goes via `facebook`.
export const OAUTH_PROVIDERS = [
  { key: 'google', name: 'Google' },
  { key: 'azure', name: 'Microsoft' },
  { key: 'linkedin_oidc', name: 'LinkedIn' },
  { key: 'facebook', name: 'Instagram / Meta' },
];

// signInWithOAuth navigates away instead of returning an error, so a provider
// that is switched off in Supabase dumps the visitor on a raw JSON error page.
// Ask first — /auth/v1/settings is public — and only offer what will work.
export function useEnabledProviders() {
  const [enabled, setEnabled] = useState(null);
  useEffect(() => {
    let alive = true;
    import('./supabase').then(({ SUPABASE_URL, SUPABASE_ANON_KEY }) =>
      fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && setEnabled(d?.external || {}))
        .catch(() => alive && setEnabled({}))
    );
    return () => {
      alive = false;
    };
  }, []);
  return {
    ready: enabled !== null,
    live: enabled ? OAUTH_PROVIDERS.filter((p) => enabled[p.key]) : [],
    pending: enabled ? OAUTH_PROVIDERS.filter((p) => !enabled[p.key]) : [],
  };
}
