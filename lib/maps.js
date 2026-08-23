// Google Maps helpers — all keyless (uses the free embed iframe + link APIs)

export function gmapsEmbedSrc({ lat, lng, query, zoom = 15 }) {
  // Keyless "place" embed. If a query string is given (e.g. venue name + address)
  // Google will show its rich pin card; otherwise we fall back to lat/lng.
  if (query) {
    const q = encodeURIComponent(query);
    return `https://www.google.com/maps?q=${q}&z=${zoom}&output=embed`;
  }
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

// A directions deep-link that works on iOS, Android and desktop.
export function gmapsDirectionsUrl({ lat, lng, query }) {
  if (query) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// Open a place in the Google Maps app / website
export function gmapsPlaceUrl({ lat, lng, query }) {
  if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function instagramUrl(handle) {
  if (!handle) return null;
  const clean = handle.replace(/^@/, '');
  return `https://instagram.com/${clean}`;
}

export function telHref(phone) {
  if (!phone) return null;
  return `tel:${phone.replace(/\s+/g, '')}`;
}
