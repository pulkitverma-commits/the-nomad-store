import Link from 'next/link';
import { PolicyPage, H, P, Small, Rows } from '@/components/PolicyPage';

export const metadata = {
  title: 'Terms',
  description:
    'The terms on which The Nomad sells: rupee pricing, how orders are accepted, what happens when stock runs out mid-order, payment, delivery, returns and liability.',
  alternates: { canonical: '/terms' },
  openGraph: { url: '/terms', type: 'website', siteName: 'The Nomad' },
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms"
      lede="Written in plain English, because we would rather you read them than agree to them."
      updated="8 August 2026"
    >
      <P>
        These terms apply when you buy something from thenomad.buzz. They are between you and The
        Nomad, a small trading business based in New Delhi, India. If anything here is unclear,
        email <a href="mailto:hype@thenomad.buzz" className="muted-link">hype@thenomad.buzz</a>{' '}
        and we will explain it in fewer words.
      </P>

      <H>1 · Who we are</H>
      <P>
        The Nomad is a two-person business that travels, buys objects from independent makers, imports
        them into India and sells them here. Our address is C-14, Shahpur Jat, New Delhi 110049. We
        sell to individuals for their own use and, on request, to businesses for gifting. We do not
        currently sell wholesale.
      </P>

      <H>2 · Prices</H>
      <P>
        All prices are in Indian rupees and include GST. They include the customs duty we have
        already paid on import, so there is nothing further to collect on delivery. Delivery is free
        over ₹2,500 and ₹150 below it; cash on delivery adds ₹50 and gift wrapping adds ₹250. Prices
        can change — the price that applies to your order is the one shown at the moment you place
        it.
      </P>

      <H>3 · Placing an order</H>
      <P>
        Adding something to your bag does not reserve it. Stock is only committed when the order is
        actually placed, which means that on a busy drop morning two people can be looking at the
        same last object and only one of them will get it. If that happens to you, the checkout will
        tell you at the point of payment rather than after it.
      </P>
      <P>
        Your order is an offer to buy. It is accepted when we send you the confirmation email. If we
        cannot fulfil it — because the object turns out to be damaged, or because a stock count was
        wrong — we will tell you and refund you in full. We reserve the right to decline an order,
        and the only times we have actually done so involved obvious resale.
      </P>

      <H>4 · Objects are not identical</H>
      <P>
        Nearly everything we sell is made by hand in small numbers. Colour, glaze, grain, weight and
        dimension vary between pieces, and photographs are of one example rather than the specific
        piece you will receive. Dimensions given on a product page are approximate. Variation of this
        kind is not a defect and is not grounds for a refund under clause 7 — although it is
        perfectly good grounds for changing your mind, which clause 7 also covers.
      </P>

      <H>5 · Payment</H>
      <Rows
        rows={[
          ['Accepted', 'UPI, credit and debit cards, net banking, wallets, cash on delivery.'],
          ['Card details', 'We never see or store them. Payment is handled by our payment provider.'],
          ['Cash on delivery', '₹50 handling. We may withdraw it for an address that has refused a previous COD parcel.'],
          ['Currency', 'Indian rupees only.'],
        ]}
      />

      <H>6 · Delivery</H>
      <P>
        We dispatch within 2–3 working days and delivery takes 2–8 days depending on where you are;
        the detail is on the <Link href="/shipping" className="muted-link">shipping page</Link>. Those
        are estimates, not guarantees, and once a parcel is with the courier its timing is not
        something we control. Risk in the object passes to you on delivery. If it arrives damaged,
        clause 7 applies and we would like a photograph within 48 hours.
      </P>

      <H>7 · Returns, damage and refunds</H>
      <P>
        You may return an object within 14 days of delivery, unused and in its original wrapping and
        with its passport card, for a refund to your original payment method within 7 working days of
        it reaching us. Anything that arrives damaged in transit is replaced or refunded in full,
        including shipping, on receipt of a photograph within 48 hours. The full position, including
        what cannot be returned, is on the{' '}
        <Link href="/returns" className="muted-link">returns page</Link> and forms part of these
        terms.
      </P>

      <H>8 · Email we send you</H>
      <P>
        If you order, we send transactional email — confirmation, dispatch, and anything that goes
        wrong. You cannot opt out of those while an order is live, for the obvious reason. Marketing
        email (Postcards From The Nomad, drop announcements, back-in-stock notices) is opt-in only
        and every one of them carries a working unsubscribe link. See the{' '}
        <Link href="/privacy" className="muted-link">privacy page</Link>.
      </P>

      <H>9 · The site itself</H>
      <P>
        Photographs on this site are either ours or licensed; product photography is credited to the
        photographer on each product page, and the journal writing is ours. Please do not copy either
        for commercial use. We try to keep prices, stock and copy accurate and we occasionally get
        something wrong; if a price is obviously and materially incorrect we will contact you rather
        than silently charge or ship it.
      </P>
      <P>
        We do not promise the site will be available without interruption. It is hosted on Vercel and
        the catalogue lives in a Supabase database; when either of those has a bad day, so do we.
      </P>

      <H>10 · Our liability</H>
      <P>
        If we get something wrong, we are responsible for loss you suffer as a foreseeable result of
        our breaking these terms or failing to use reasonable care. Except where the object itself
        is defective or dangerous, our liability is limited to the amount you paid for the order. We
        do not limit liability for death, personal injury, or fraud, and nothing here affects your
        rights under the Consumer Protection Act, 2019.
      </P>

      <H>11 · Changes and law</H>
      <P>
        We may change these terms; the version that applies to your order is the one published when
        you placed it. These terms are governed by Indian law and the courts of Delhi have
        jurisdiction.
      </P>

      <Small>
        Last updated 8 August 2026. Previous versions are not archived publicly — if you need the one
        that applied to an order you placed, email us and we will send it.
      </Small>
    </PolicyPage>
  );
}
