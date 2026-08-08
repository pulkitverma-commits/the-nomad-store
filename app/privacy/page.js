import Link from 'next/link';
import { PolicyPage, H, P, Small, Rows } from '@/components/PolicyPage';

export const metadata = {
  title: 'Privacy',
  description:
    'Exactly what The Nomad collects — name, email, phone and address for orders; email alone for the newsletter, drops and notify-me — who processes it (Supabase, Vercel, Mandrill, Cloudinary, MapTiler) and how to get it deleted.',
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy"
      lede="A short page, because we collect very little and would rather not have to look after more."
      updated="8 August 2026"
    >
      <P>
        This page describes what The Nomad does with your data. It is written to be accurate rather
        than comprehensive-sounding: everything below is something the site actually does. If you
        want anything deleted, email{' '}
        <a href="mailto:hello@thenomad.store" className="muted-link">hello@thenomad.store</a> and we
        will do it within seven working days and tell you when it is done.
      </P>

      <H>What we collect, and when</H>
      <Rows
        rows={[
          [
            'When you order',
            'Your name, email address, phone number and delivery address (street, city, state, PIN). Plus what you bought, the total, your chosen payment method, and a gift message if you write one.',
          ],
          [
            'Newsletter — Postcards',
            'Your email address. Nothing else. No name field, because we do not need one.',
          ],
          [
            'Drops list',
            'Your email address, and a note that you signed up from the drops page rather than the footer.',
          ],
          [
            'Notify me',
            'Your email address and the name of the object you asked about, so we can write to you when it lands.',
          ],
          [
            'Never',
            'Card or UPI details. Those go straight to the payment provider and never touch our database. Also: no date of birth, no gender, no advertising identifiers, no third-party tracking pixels.',
          ],
        ]}
      />

      <H>What stays in your browser</H>
      <P>
        Your bag and your saved objects are kept in your browser’s local storage under the keys{' '}
        <code style={{ fontSize: 13 }}>nomad-bag</code> and{' '}
        <code style={{ fontSize: 13 }}>nomad-saved</code>. They are not sent to us, they are not tied
        to an account, and we cannot see them. Clearing your browser data clears them. That is also
        why your saved list does not follow you to another device.
      </P>

      <H>Who processes it for us</H>
      <Rows
        rows={[
          [
            'Supabase',
            'Our database. Orders, subscriber emails and the product catalogue live here. Hosted on Amazon Web Services.',
          ],
          [
            'Vercel',
            'Hosting for the site itself, plus Vercel Web Analytics — aggregate page-view counts, no cookies, no cross-site tracking and no attempt to identify you.',
          ],
          [
            'Mandrill (Mailchimp)',
            'Sends every email we send: order confirmations, dispatch notices, the newsletter, drop announcements and notify-me alerts. Your email address is passed to them for that purpose.',
          ],
          [
            'Cloudinary',
            'Serves every photograph on the site. Loading a page means your browser requests images from them, so they see your IP address, as any image host would.',
          ],
          [
            'MapTiler',
            'Draws the small map on each product page showing where the object was found. Same position: your browser requests map tiles, so they see your IP address.',
          ],
          [
            'Courier partners',
            'Get your name, address and phone number, because otherwise the parcel does not arrive.',
          ],
        ]}
      />
      <Small>
        We do not sell data, we do not share it for advertising, and we have never been asked to hand
        any of it over by anybody. If that changes we will say so on this page.
      </Small>

      <H>Email you receive</H>
      <P>
        Order-related email is transactional: you get it because you bought something, and you cannot
        unsubscribe from it while an order is in progress. Everything else — the newsletter, drop
        announcements, notify-me alerts — is opt-in and carries an{' '}
        <Link href="/unsubscribe" className="muted-link">unsubscribe link</Link> at the foot of every
        single message. It takes one click, it works immediately, and you do not need to email us
        about it. We send at most twice a month, plus a note before a drop.
      </P>

      <H>How long we keep it</H>
      <Rows
        rows={[
          ['Order records', 'Eight years, because Indian tax law requires it.'],
          ['Subscriber emails', 'Until you unsubscribe, then deleted within thirty days.'],
          ['Notify-me requests', 'Until the object lands and we have written to you, then deleted.'],
          ['Email delivery logs', 'Twelve months, so we can tell whether a confirmation actually reached you.'],
        ]}
      />

      <H>Your rights</H>
      <P>
        You can ask us what we hold about you, ask us to correct it, or ask us to delete it. One
        email is enough and we do not require a form or proof of identity beyond replying from the
        address in question. The only thing we cannot delete on request is an order record inside the
        eight-year tax window; we will delete everything else and tell you exactly what is left.
      </P>

      <H>Children</H>
      <Small>
        The site is not intended for anyone under 18, and we do not knowingly collect anything from
        children.
      </Small>

      <H>Changes to this page</H>
      <Small>
        Last updated 8 August 2026. If we start collecting something new or add a processor to the
        list above, we will change this page and change the date at the same time. See also the{' '}
        <Link href="/terms" className="muted-link">terms</Link>.
      </Small>
    </PolicyPage>
  );
}
