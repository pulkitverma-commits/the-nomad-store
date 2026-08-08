'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MlMap, Marker, Popup, LngLatBounds, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { countrySlug } from '@/lib/format';

// A thin variant of components/WorldMap for one customer's own pins.
//
// WorldMap is right for the catalogue and wrong here, in two specific ways:
//  1. It builds the map once on mount from whatever `cities` it was holding at
//     that moment. The catalogue arrives server-rendered, so that is always the
//     full list; a collection arrives later, from an RPC, so the markers would
//     be built from an empty array. This one rebuilds when the pins change.
//  2. It only fits bounds when there are two or more pins. The catalogue always
//     has dozens; a collection is very often a single city, which would leave
//     the customer looking at the whole world with one dot somewhere on it.
//     A single pin gets centred at a readable zoom instead.
// The cartography, the dot, the popup chrome and the click-through to the
// country page are deliberately identical, so the two maps read as one map.

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'Zarnd4HdiakX7HdqsByF';
const STYLE = `https://api.maptiler.com/maps/landscape/style.json?key=${MAPTILER_KEY}`;

export default function CollectionMap({ cities, aspect = '2.2/1' }) {
  const el = useRef(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [failed, setFailed] = useState(false);

  // Only the coordinates matter for rebuilding, so a re-render that keeps the
  // same pins does not tear the map down.
  const pts = (cities || [])
    .filter((c) => c && c.lat != null && c.lon != null)
    .map((c) => ({
      city: c.city,
      country: c.country,
      lat: Number(c.lat),
      lon: Number(c.lon),
      count: Number(c.count) || 1,
    }))
    .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon));
  const sig = pts.map((c) => `${c.city}:${c.lat}:${c.lon}:${c.count}`).join('|');
  const ptsRef = useRef(pts);
  ptsRef.current = pts;

  useEffect(() => {
    if (!el.current) return undefined;
    const list = ptsRef.current;
    if (list.length === 0) return undefined;

    let map;
    let markers = [];
    // WebGL can be unavailable (older machines, hardened browsers). A map that
    // cannot be drawn should leave the rest of the page standing.
    try {
      map = new MlMap({
        container: el.current,
        style: STYLE,
        center: [list[0].lon, list[0].lat],
        zoom: list.length === 1 ? 4.2 : 1.4,
        minZoom: 0.8,
        maxZoom: 10,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

      if (list.length > 1) {
        const bounds = new LngLatBounds();
        list.forEach((c) => bounds.extend([c.lon, c.lat]));
        map.fitBounds(bounds, { padding: 64, maxZoom: 6, duration: 0 });
      }

      markers = list.map((c) => {
        const holder = document.createElement('div');
        holder.style.cssText =
          'width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
        const dot = document.createElement('div');
        dot.style.cssText =
          'width:12px;height:12px;border-radius:50%;background:#111111;border:2px solid #FFFDF4;box-shadow:0 1px 6px rgba(17,17,17,0.35);transition:transform .25s;';
        holder.appendChild(dot);
        holder.onmouseenter = () => (dot.style.transform = 'scale(1.7)');
        holder.onmouseleave = () => (dot.style.transform = 'scale(1)');
        if (c.country) {
          holder.onclick = () => routerRef.current.push(`/country/${countrySlug(c.country)}`);
        }

        const popup = new Popup({
          offset: 14,
          closeButton: false,
          closeOnClick: false,
          className: 'nomad-popup',
        }).setHTML(
          `<div style="font-size:12px;letter-spacing:0.12em">${c.city || ''}${
            c.city && c.country ? ', ' : ''
          }${c.country || ''}</div>` +
            `<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#8A8A85;margin-top:5px">${
              c.count === 1 ? 'One object of yours' : `${c.count} objects of yours`
            }</div>`
        );
        holder.addEventListener('mouseenter', () => popup.setLngLat([c.lon, c.lat]).addTo(map));
        holder.addEventListener('mouseleave', () => popup.remove());

        return new Marker({ element: holder, anchor: 'center' })
          .setLngLat([c.lon, c.lat])
          .addTo(map);
      });
    } catch (e) {
      setFailed(true);
      return undefined;
    }

    return () => {
      try {
        markers.forEach((m) => m.remove());
        map.remove();
      } catch (e) {}
    };
  }, [sig]);

  if (failed || pts.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: aspect,
          background: '#EDEAE3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: '0.06em', color: '#6B6B68', lineHeight: 1.8 }}>
          {pts.length === 0
            ? 'No coordinates on these objects yet — the places are listed below.'
            : 'The map could not be drawn in this browser. The places are listed below.'}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .nomad-popup .maplibregl-popup-content{background:#111111;color:#FFFFFF;padding:12px 16px;border-radius:0;font-family:var(--font-sans),sans-serif;box-shadow:0 10px 26px rgba(17,17,17,0.28)}
        .nomad-popup .maplibregl-popup-tip{border-top-color:#111111;border-bottom-color:#111111}
        .maplibregl-ctrl-group{border-radius:0!important;box-shadow:0 2px 10px rgba(17,17,17,0.12)!important}
      `}</style>
      <div
        ref={el}
        style={{
          width: '100%',
          aspectRatio: aspect,
          background: '#EDEAE3',
          overflow: 'hidden',
          position: 'relative',
        }}
      />
    </>
  );
}
