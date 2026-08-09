import { ldJson } from '@/lib/seo';

/**
 * Renders one or more JSON-LD graphs into the document.
 *
 * Server component — this is markup for crawlers, not state for the browser,
 * so it must never end up in a client bundle. `ldJson` escapes the one
 * character (`<`) that could otherwise close the script tag early.
 */
export default function JsonLd({ data }) {
  const graphs = Array.isArray(data) ? data : [data];
  return (
    <>
      {graphs.filter(Boolean).map((g, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(g) }}
        />
      ))}
    </>
  );
}
