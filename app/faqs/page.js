import Link from 'next/link';
import { PolicyPage, P, Small, Qa } from '@/components/PolicyPage';

export const metadata = {
  title: 'FAQs',
  description:
    'How objects are chosen, why the quantities are tiny, what the passport card is, why we do not restock, how drops work, and how to look after unlacquered brass, unglazed terracotta and lacquerware.',
};

export default function FaqsPage() {
  return (
    <PolicyPage
      title="Questions"
      lede="The ones we are actually asked, answered at the length they deserve."
    >
      <P>
        Shipping costs and timings live on the{' '}
        <Link href="/shipping" className="muted-link">shipping page</Link>; sending something back is
        on the <Link href="/returns" className="muted-link">returns page</Link>. What follows is
        everything else.
      </P>

      <div style={{ borderTop: '1px solid #E8E8E5', marginTop: 34 }}>
        <Qa q="How do you decide what to sell?">
          We go, we walk, and we buy things we would keep. There is no buying committee and no
          trend forecast. The test we apply in the workshop is whether somebody made a decision —
          about a curve, a weight, a finish — and then stood by it, and whether the object will still
          be in use in twenty years. We also do not buy on the first visit. If it is still on our
          minds the next morning, we go back. A good proportion of our collection trips end with us
          buying nothing at all, which is not a wasted trip: you learn what a thing should cost and
          what it should feel like, so that you recognise it somewhere else.
        </Qa>

        <Qa q="Why are the quantities so small?">
          Because that is how many there were. A workshop of three people in Kyoto makes about two
          hundred pieces a month and sells most of them locally; what we can buy is whatever is on
          the drying rack that week. Twelve of something is a large purchase for us. Four is common.
          We could ask a maker to scale up, and every so often someone offers, but the thing that
          makes the object worth carrying halfway around the world is precisely the thing that
          disappears when you make four hundred of it a month.
        </Qa>

        <Qa q="What is the passport card?">
          A small card that travels in the box with every object. It records where it was found, the
          workshop or maker where possible, the coordinates, the collection trip it came from, and
          the object number. It is written out for each piece rather than printed in bulk. It is the
          part of the business we care most about, partly for the obvious romantic reason and partly
          for a practical one: it is the only durable record of provenance an object like this ever
          gets. Keep it. We ask for it back if you return something, and it will matter if you ever
          pass the object on.
        </Qa>

        <Qa q="Will you restock something that has sold out?">
          Almost never, and we would rather say that plainly than keep you on a waiting list. When
          an object shows “sold out — gone for good”, it means the batch is finished and we have no
          reason to believe there will be another one in that form. Sometimes we go back to the same
          maker on a later trip and come home with something adjacent — a different glaze, a
          slightly different size — and we list it as a new object rather than pretending it is the
          old one back. If you want to hear about that, the drops list is the place to be.
        </Qa>

        <Qa q="What is a drop?">
          Everything from one collection trip, released at once, usually on a Sunday at 11am IST.
          Between twenty and forty objects. We do it that way because the alternative is trickling
          things onto the site as they clear customs, which means the good pieces go to whoever
          happened to be looking that afternoon. A drop is announced by email about four days
          beforehand with a full preview, so you can decide before the clock starts rather than
          during it. Objects in the drop are not held back or drip-fed — what is there on Sunday
          morning is everything.
        </Qa>

        <Qa q="Do you gift wrap?">
          Yes, ₹250, ticked at checkout. Unbleached paper, cotton string, a wax seal and a
          hand-written card with your message on it — no plastic, no ribbon, nothing that has to be
          thrown away. If it is going straight to the recipient we leave the invoice out and email
          it to you instead. Say so in the message field. We cannot gift wrap and dispatch the same
          day; add a day to the timings on the shipping page.
        </Qa>

        <Qa q="How do I look after unlacquered brass?">
          Leave it alone and it will do the right thing. Unlacquered brass oxidises from yellow to a
          soft brown over roughly eighteen months and then more or less stops changing. If you want
          it bright again: half a lemon and a spoonful of salt, thirty seconds, rinse and dry
          properly. What you must not do is use a proprietary metal polish on a chased or hammered
          surface — the abrasive collects in the recesses and dries chalky white, and getting it out
          involves a toothbrush and an afternoon. We know this because we did it to a tray in 2024.
          Never put brass in a dishwasher.
        </Qa>

        <Qa q="And unglazed terracotta?">
          Terracotta is porous, which is the whole point — a Verdú water jug keeps water cool because
          a little of it evaporates through the wall. Season a new piece by filling it with water and
          leaving it for a day before first use; the first day of water is best poured on a plant.
          Wash with hot water and a brush, never with detergent, which the clay absorbs and then
          releases into whatever you put in next. Expect water marks and a darkening of the surface.
          Do not put it in a fridge wet and do not put it in a dishwasher.
        </Qa>

        <Qa q="And lacquerware?">
          Lacquer is tougher than it looks and hopeless at exactly two things: heat and sunlight. Do
          not put it in a dishwasher, a microwave or an oven, and do not leave it on a windowsill —
          UV dulls the surface and, over years, will craze it. Wash by hand in warm water with a soft
          cloth, dry immediately, and never use anything abrasive. A new piece may smell faintly for
          a week or two; leave it out and it goes. Properly kept, a Hoi An bowl outlives its owner,
          which is the standard we bought it against.
        </Qa>

        <Qa q="Do I have to pay customs or import duty?">
          No. We import everything ourselves, pay the duty, and clear it through Indian customs
          before it is ever listed — the price you see is the price you pay, and there is nothing to
          collect at your door. We ship domestically within India only. If you are ordering from
          outside India, we are afraid we cannot help yet; see the shipping page for why.
        </Qa>

        <Qa q="Do you do corporate gifting?">
          Yes, within reason, and the reason is stock. We can usually put together twenty to fifty
          gifts if you give us four to six weeks, and we will be honest about which objects can be
          matched in that quantity and which cannot — a set of forty identical Kyoto bowls does not
          exist and we will not pretend otherwise. What tends to work better is a fixed price per
          gift with a curated spread of objects, each with its own passport card. Email us with
          numbers, a budget and the date, and please make the date real.
        </Qa>

        <Qa q="Is everything really handmade?">
          Not everything, and we try to be exact about it. Some objects are hand-made start to
          finish by one person. Some are machine-made to a very high standard by a small workshop —
          the Zurich rulers are turned on a lathe by a shop that otherwise makes aerospace parts, and
          they are none the worse for it. What we do not carry is anything that is factory-produced
          and dressed up as artisanal. If you want to know exactly how a particular object was made,
          ask; whoever answers will have been in the room.
        </Qa>
      </div>

      <Small>
        Still stuck? Write to{' '}
        <a href="mailto:hype@thenomad.buzz" className="muted-link">hype@thenomad.buzz</a> — see
        the <Link href="/contact" className="muted-link">contact page</Link> for how quickly we
        answer, and when we do not.
      </Small>
    </PolicyPage>
  );
}
