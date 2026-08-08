'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MlMap, Marker, Popup, LngLatBounds, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { countrySlug } from '@/lib/format';

// Public frontend key (MapTiler keys are client-side by design; restrict by
// HTTP origin in MapTiler Cloud -> API keys for extra safety).
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'Zarnd4HdiakX7HdqsByF';
// "landscape" — MapTiler's soft terrain cartography; muted greens and creams
// that sit well with the store's editorial palette. Attribution kept (required on free plan).
const STYLE = `https://api.maptiler.com/maps/landscape/style.json?key=${MAPTILER_KEY}`;

export default function WorldMap({ cities, aspect = '2.2/1', big = false }) {
  const el = useRef(null);
  const router = useRouter();
  const citiesRef = useRef(cities);
  citiesRef.current = cities;

  useEffect(() => {
    if (!el.current) return;
    const map = new MlMap({
      container: el.current,
      style: STYLE,
      center: [40, 28],
      zoom: big ? 1.6 : 1.1,
      minZoom: 0.8,
      maxZoom: 10,
      attributionControl: { compact: true },
      cooperativeGestures: !big,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    // Fit to all cities
    const pts = citiesRef.current.filter((c) => c.lat != null && c.lon != null);
    if (pts.length > 1) {
      const bounds = new LngLatBounds();
      pts.forEach((c) => bounds.extend([c.lon, c.lat]));
      map.fitBounds(bounds, { padding: big ? 70 : 50, duration: 0 });
    }

    const markers = pts.map((c) => {
      // Outer element is positioned by MapLibre via CSS transform — never touch
      // its transform. The visual dot lives inside and handles hover scaling.
      const holder = document.createElement('div');
      holder.style.cssText = 'width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
      const dot = document.createElement('div');
      dot.style.cssText =
        'width:12px;height:12px;border-radius:50%;background:#111111;border:2px solid #FFFDF4;box-shadow:0 1px 6px rgba(17,17,17,0.35);transition:transform .25s;';
      holder.appendChild(dot);
      holder.onmouseenter = () => (dot.style.transform = 'scale(1.7)');
      holder.onmouseleave = () => (dot.style.transform = 'scale(1)');
      holder.onclick = () => router.push(`/country/${countrySlug(c.country)}`);

      const popup = new Popup({
        offset: 14,
        closeButton: false,
        closeOnClick: false,
        className: 'nomad-popup',
      }).setHTML(
        `<div style="font-size:12px;letter-spacing:0.12em">${c.city}, ${c.country}</div>` +
          `<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#8A8A85;margin-top:5px">${c.count} ${
            c.count === 1 ? 'object discovered' : 'objects discovered'
          }</div>` +
          (big
            ? `<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;margin-top:9px">Explore ${c.city} →</div>`
            : '')
      );
      holder.addEventListener('mouseenter', () => popup.setLngLat([c.lon, c.lat]).addTo(map));
      holder.addEventListener('mouseleave', () => popup.remove());

      return new Marker({ element: holder, anchor: 'center' })
        .setLngLat([c.lon, c.lat])
        .addTo(map);
    });

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [big]);

  return (
    <>
      <style>{`
        .nomad-popup .maplibregl-popup-content{background:#111111;color:#FFFFFF;padding:12px 16px;border-radius:0;font-family:var(--font-sans),sans-serif;box-shadow:0 10px 26px rgba(17,17,17,0.28)}
        .nomad-popup .maplibregl-popup-tip{border-top-color:#111111;border-bottom-color:#111111}
        .maplibregl-ctrl-group{border-radius:0!important;box-shadow:0 2px 10px rgba(17,17,17,0.12)!important}
      `}</style>
      <div ref={el} style={{ width: '100%', aspectRatio: aspect, background: '#EDEAE3' }} />
    </>
  );
}
