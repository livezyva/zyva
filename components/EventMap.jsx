"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

/**
 * Real interactive dark map (looks exactly like Google Maps at night) with
 * event thumbnails as pins. Pins are perfectly locked to their real GPS
 * coordinates — they follow the map when you pan or zoom.
 *
 * Tiles: CartoDB Dark Matter — free, no API key, streets/coastline/labels.
 * Pins: circular event cover photo, green ring, cluster count when overlapping.
 */

const CITY_PRESETS = [
  { id: 'all',      label: 'All Cyprus', lat: 35.00, lng: 33.30, zoom: 9  },
  { id: 'limassol', label: 'Limassol',   lat: 34.71, lng: 33.05, zoom: 13 },
  { id: 'nicosia',  label: 'Nicosia',    lat: 35.17, lng: 33.36, zoom: 13 },
  { id: 'paphos',   label: 'Paphos',     lat: 34.77, lng: 32.42, zoom: 13 },
  { id: 'larnaca',  label: 'Larnaca',    lat: 34.92, lng: 33.63, zoom: 13 },
  { id: 'ayianapa', label: 'Ayia Napa',  lat: 34.99, lng: 33.99, zoom: 13 },
];

// Cluster events at the same venue into a single pin
function clusterEvents(events) {
  const buckets = new Map();
  for (const e of events) {
    if (e.latitude == null || e.longitude == null) continue;
    const key = `${e.latitude.toFixed(4)}:${e.longitude.toFixed(4)}`;
    const b = buckets.get(key);
    if (b) b.events.push(e);
    else buckets.set(key, { lat: e.latitude, lng: e.longitude, events: [e] });
  }
  return [...buckets.values()];
}

// Build a photo-thumbnail pin
function buildPhotoIcon({ imageUrl, count, selected }) {
  const size = selected ? 56 : 46;
  const ring = selected ? 3 : 2;
  const countBadge = count > 1
    ? `<span class="zyva-photo-pin-count">${count}</span>`
    : '';
  const html = `
    <div class="zyva-photo-pin ${selected ? 'is-selected' : ''}" style="width:${size}px;height:${size}px;border-width:${ring}px">
      <div class="zyva-photo-pin-img" style="background-image:url('${imageUrl.replace(/'/g, "\\'")}')"></div>
      ${countBadge}
      <div class="zyva-photo-pin-tail"></div>
    </div>
  `;
  return L.divIcon({
    className: 'zyva-photo-pin-wrap',
    html,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 4],
    popupAnchor: [0, -size],
  });
}

// Controller: fit bounds, respond to selectedId, resize
function MapController({ clusters, selectedId }) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (clusters.length === 0) return;
    if (clusters.length === 1) {
      map.setView([clusters[0].lat, clusters[0].lng], 14, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(clusters.map(c => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: didFit.current });
    didFit.current = true;
  }, [clusters, map]);

  useEffect(() => {
    if (!selectedId) return;
    const sel = clusters.find(c => c.events.some(e => e.id === selectedId));
    if (!sel) return;
    map.flyTo([sel.lat, sel.lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
  }, [selectedId, clusters, map]);

  return null;
}

// City quick-zoom bar (renders inside the map container using useMap)
function CityBar() {
  const map = useMap();
  return (
    <div className="absolute top-3 left-3 z-[500] flex flex-wrap gap-1.5">
      {CITY_PRESETS.map(c => (
        <button
          key={c.id}
          onClick={() => map.flyTo([c.lat, c.lng], c.zoom, { duration: 0.7 })}
          className="px-3 py-1 rounded-full text-[11px] font-semibold bg-black/80 backdrop-blur text-white border border-zborder hover:border-zneon hover:text-zneon transition"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export default function EventMap({ events, selectedId, onSelect, onOpen }) {
  const clusters = useMemo(() => clusterEvents(events), [events]);
  const router = useRouter();

  // Prefetch the currently-selected event's detail page so the tap-to-open
  // navigation feels instant.
  useEffect(() => {
    if (!selectedId) return;
    const sel = events.find(e => e.id === selectedId);
    if (sel) router.prefetch(`/events/${sel.slug}`);
  }, [selectedId, events, router]);

  return (
    <MapContainer
      center={[35.0, 33.3]}
      zoom={9}
      style={{ width: '100%', height: '100%', background: '#0b0b0f' }}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      <ZoomControl position="topright" />
      <CityBar />
      <MapController clusters={clusters} selectedId={selectedId} />

      {clusters.map((c, i) => {
        const containsSelected = c.events.some(e => e.id === selectedId);
        return (
          <Marker
            key={i}
            position={[c.lat, c.lng]}
            icon={buildPhotoIcon({
              imageUrl: c.events[0].cover_image_url,
              count: c.events.length,
              selected: containsSelected,
            })}
            eventHandlers={{
              click: () => {
                // Tap-once → select & preview; tap-again on the same pin → open details.
                // (Cluster pins with multiple events always just preview so the user
                // can pick which one they want from the card / list.)
                if (containsSelected && c.events.length === 1 && onOpen) {
                  onOpen(c.events[0]);
                } else if (onSelect) {
                  onSelect(c.events[0]);
                }
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}
