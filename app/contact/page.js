import Link from 'next/link';
import { PolicyPage, H, P, Small, Rows } from '@/components/PolicyPage';

export const metadata = {
  title: 'Contact',
  description:
    'Write to hello@thenomad.store. One reply, from one of two people, usually within a working day — slower when we are on a collection trip. Studio address in New Delhi.',
};

export default function ContactPage() {
  return (
    <PolicyPage
      title="Contact"
      lede="There are two of us. One of us will answer, and it will be an actual answer."
    >
      <P>
        There is no contact form on this page. We considered building one and decided against it:
        a form is a good way to make a message disappear into a spreadsheet nobody opens. Email
        reaches us on our phones, which is where we mostly are.
      </P>

      <div
        style={{
          border: '1px solid #E8E8E5',
          background: '#FFFFFF',
          padding: '44px 40px',
          margin: '34px 0 40px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#6B6B68',
            marginBottom: 18,
          }}
        >
          Write to us
        </div>
        <a
          href="mailto:hello@thenomad.store"
          className="serif"
          style={{
            fontSize: 40,
            lineHeight: 1.1,
            display: 'inline-block',
            borderBottom: '1px solid #111111',
            paddingBottom: 8,
            wordBreak: 'break-word',
          }}
        >
          hello@thenomad.store
        </a>
        <div style={{ fontSize: 13, lineHeight: 1.85, color: '#6B6B68', marginTop: 24 }}>
          Include your order number if there is one. If it is about a specific object, the object
          number — the <span style={{ color: '#111111' }}>#JP-014</span> style code on the product
          page — saves us both a round trip.
        </div>
      </div>

      <H>When you will hear back</H>
      <Rows
        rows={[
          ['Normally', 'Within one working day.'],
          ['Order and delivery questions', 'Same day, if you write before about 4pm IST.'],
          ['Mid-trip', 'Two to four days. See below — this is not us ignoring you.'],
          ['Weekends', 'We read but rarely reply. Nothing is dispatched either.'],
        ]}
      />

      <H>Why we are sometimes slow</H>
      <P>
        We spend six to ten weeks a year on collection trips, and on those weeks we are in
        workshops, in markets, or on a train with no signal, in a timezone that is not yours. Email
        gets answered late in the evening and sometimes not until the next town. If something is
        urgent — an order that has not arrived, a parcel that broke — put the word{' '}
        <strong>urgent</strong> in the subject line and it will jump the queue. We would rather you
        used it than sat waiting politely.
      </P>

      <H>The studio</H>
      <Rows
        rows={[
          ['The Nomad', 'C-14, Shahpur Jat, New Delhi 110049, India'],
          ['Hours', 'Monday to Friday, 10am – 6pm IST'],
          ['Visits', 'By appointment only — email first. It is a packing room, not a shop.'],
          ['Press and stockists', 'Same address. Put “press” in the subject line.'],
        ]}
      />
      <Small>
        We do not take orders or payment at the studio and we do not have a telephone line worth
        publishing — it rings in a room that is empty most afternoons.
      </Small>

      <H>Other things you might be looking for</H>
      <P>
        Delivery times and costs are on the{' '}
        <Link href="/shipping" className="muted-link">shipping page</Link>. Sending something back is
        on the <Link href="/returns" className="muted-link">returns page</Link>. Ten or so questions
        we are actually asked are answered on the{' '}
        <Link href="/faqs" className="muted-link">FAQs</Link>. Corporate and bulk gifting: email us
        with quantities and a date, and please make the date real — we cannot conjure forty of
        anything.
      </P>
      <Small>
        To come off the mailing list, use the unsubscribe link at the foot of any email we have sent
        you. It works immediately and you do not need to write to us about it.
      </Small>
    </PolicyPage>
  );
}
