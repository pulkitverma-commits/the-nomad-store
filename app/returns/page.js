import Link from 'next/link';
import { PolicyPage, H, P, Small, Rows, Pull } from '@/components/PolicyPage';

export const metadata = {
  title: 'Returns',
  description:
    'Fourteen days from delivery, unused and in its original wrapping, with the passport card. Refunds to the original payment method within 7 working days. Damaged in transit? Send a photograph within 48 hours.',
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Returns"
      lede="Fourteen days, the original wrapping, and the passport card back in the box."
    >
      <P>
        Most of what we sell exists in single figures, so a return is not a small administrative
        event for us — it is the object going back on the shelf and waiting for somebody else. We
        still think you should be able to send it back, and this is how that works.
      </P>

      <H>The window</H>
      <Rows
        rows={[
          ['You have', '14 days from the day it is delivered.'],
          ['Condition', 'Unused, unwashed, no marks, in its original unbleached paper.'],
          ['Must come back', 'The passport card. It is part of the object.'],
          ['Refund', 'To the original payment method, within 7 working days of the parcel reaching us.'],
        ]}
      />
      <P>
        To start one, email{' '}
        <a href="mailto:hype@thenomad.buzz" className="muted-link">hype@thenomad.buzz</a> with
        your order number and which object it is. We will reply with an address and, where the
        courier allows it, arrange a pickup. Return postage is yours unless the object arrived
        damaged or we sent the wrong thing, in which case it is ours.
      </P>

      <H>The passport card</H>
      <P>
        We ask for the card back because it is not packaging. It records where the object was found,
        who made it and the coordinates of the workshop, and it is written out once. Without it the
        object cannot go back on the shelf as the thing we described. If you have genuinely lost it,
        tell us — we will write another and take ₹100 off the refund, which is roughly what the card
        and the hour cost.
      </P>

      <H>If it arrives damaged</H>
      <P>
        Send us a photograph within <strong>48 hours</strong> of delivery — the object, and the box
        and packing it came in, which is what tells us whether the fault was ours or the courier’s.
        We will replace it if there is another one, and refund you in full if there is not,
        including whatever you paid for shipping. You do not need to send the broken piece back
        unless we ask, and we usually will not ask.
      </P>
      <Small>
        Ceramics and glass are double-boxed for this reason and it works most of the time. When it
        does not, it is our problem and not yours to prove.
      </Small>

      <Pull>
        “A colour that varies, a glaze that pools, a grain that runs the other way — none of these
        are faults. They are the reason the thing costs what it does.”
      </Pull>

      <H>What is not a fault</H>
      <P>
        Nearly everything here is made by hand, in ones and twos, from materials that behave
        differently batch to batch. So: the glaze on two Porto plates will not match exactly. Cedar
        and olive wood vary in grain and darken with light. Unlacquered brass arrives yellow and
        goes brown within about eighteen months, on purpose. Terracotta is porous and will develop
        water marks. Hand-painted lines wobble slightly, because a person painted them and got one
        attempt.
      </P>
      <P>
        None of that is a defect and none of it is grounds for a return on our account — though you
        are of course still welcome to send it back within the fourteen days simply because you have
        changed your mind. We would rather you did that than kept something you do not like. We just
        would rather not describe it as broken.
      </P>

      <H>What cannot be returned</H>
      <Rows
        rows={[
          ['Sale and last-one objects', 'Returnable, but only for a refund — we cannot exchange what we do not have a second of.'],
          ['Gift wrapping', 'The ₹250 is not refunded once it has been wrapped.'],
          ['Anything used', 'A cup that has held coffee, a board that has been cut on. We are not able to resell it.'],
          ['Beyond 14 days', 'Write to us anyway. We are unreasonable about deadlines less often than this page suggests.'],
        ]}
      />

      <H>Exchanges</H>
      <P>
        We do not run formal exchanges, because the stock rarely allows it. In practice: send the
        object back, we refund it, and you order the other thing. If the other thing is likely to
        sell out first, say so in the email and we will hold it for you until your return arrives.
      </P>

      <H>Your statutory rights</H>
      <Small>
        Nothing on this page limits your rights under the Consumer Protection Act, 2019. If we and
        you disagree, we would much rather sort it out over email than anywhere else. See also the{' '}
        <Link href="/terms" className="muted-link">terms</Link> and the{' '}
        <Link href="/shipping" className="muted-link">shipping page</Link>.
      </Small>
    </PolicyPage>
  );
}
