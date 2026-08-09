import Link from 'next/link';
import { PolicyPage, H, P, Small, Rows, Pull } from '@/components/PolicyPage';

export const metadata = {
  title: 'Shipping',
  description:
    'How we pack and post from New Delhi: free delivery over ₹2,500, ₹150 below it, dispatch in 2–3 working days, and 2–8 days on the road depending on where you are.',
};

export default function ShippingPage() {
  return (
    <PolicyPage
      title="Shipping"
      lede="Everything leaves from one room in New Delhi, packed by the same two people who bought it."
    >
      <P>
        We are not a warehouse. Orders are packed by hand in the order they arrive, usually in the
        evening, and handed over to the courier the following morning. That has consequences — good
        and bad — and this page is an attempt to set them out plainly rather than in the language of
        a shipping policy.
      </P>

      <H>What it costs</H>
      <Rows
        rows={[
          ['Orders over ₹2,500', 'Free, anywhere in India.'],
          ['Orders under ₹2,500', '₹150 flat.'],
          ['Cash on delivery', 'Add ₹50 handling. Available on most Indian pin codes.'],
          ['Gift wrapping', '₹250, added at checkout. Unbleached paper, cotton string, no plastic.'],
        ]}
      />
      <Small>
        There is no separate charge for insurance, fuel or remote pin codes. If a courier refuses a
        pin code we will tell you within a working day and refund in full rather than quietly sitting
        on the order.
      </Small>

      <H>How long it takes</H>
      <P>
        We dispatch within <strong>2–3 working days</strong> of an order. Occasionally a single object
        needs its passport card written out and that adds a day; occasionally we are in another
        country and it adds three, in which case you will hear from us rather than guess.
      </P>
      <Rows
        rows={[
          ['Delhi NCR', '2–4 days from dispatch'],
          ['Metros', '3–5 days — Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad'],
          ['Rest of India', '5–8 days'],
        ]}
      />
      <Small>
        Working days are Monday to Friday. Nothing moves on a national holiday and very little moves
        in the first week of a Delhi monsoon.
      </Small>

      <H>How it is packed</H>
      <P>
        Every object is wrapped in unbleached paper, taped without plastic, and packed in a
        corrugated box with shredded kraft rather than bubble wrap or foam beads. Ceramics and glass
        are double-boxed. Nothing carries a brand sticker on the outside, partly because it is a
        gift half the time and partly because an unmarked box gets handled better than one that
        announces it is fragile.
      </P>
      <P>
        Inside, with the object, is its passport card: where it was found, who made it, the
        coordinates of the workshop, and the collection number. It is a small card and it is the
        point of the whole business. Keep it with the object — you will want it if you ever return
        or resell the piece.
      </P>

      <Pull>
        “If it arrives badly, tell us within 48 hours with a photograph. We would rather replace it
        than argue about the courier.”
      </Pull>

      <H>Tracking</H>
      <P>
        You get an email when the order is placed and a second one with a tracking number when it
        leaves us, sent through Mandrill. If the second email has not arrived within four working
        days, something has gone wrong at our end and we would genuinely like to know — write to{' '}
        <a href="mailto:hype@thenomad.buzz" className="muted-link">hype@thenomad.buzz</a>.
      </P>

      <H>Cash on delivery</H>
      <P>
        Available on most Indian pin codes for ₹50. We ask, politely, that you actually take the
        parcel: a refused COD order costs us the shipping both ways and, more to the point, the
        object was probably the only one.
      </P>

      <H>International</H>
      <P>
        We do not ship outside India yet, and we would rather say so than take an order we cannot
        fulfil well. The obstacle is not the freight — it is that half of what we sell is a single
        low-fired ceramic piece, and the packing and duty paperwork that would make that survive a
        transcontinental journey costs more than the object. We are working on it for a few
        categories. If you are abroad and want to know when, write to us and we will keep the note.
      </P>

      <H>Anything else</H>
      <P>
        Returns, damage and the 14-day window are set out on the{' '}
        <Link href="/returns" className="muted-link">returns page</Link>. Everything else is on the{' '}
        <Link href="/faqs" className="muted-link">FAQs</Link>, or ask us directly.
      </P>
    </PolicyPage>
  );
}
