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
  const input = String(handle).trim();
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      return host === 'instagram.com' ? url.toString() : null;
    } catch { return null; }
  }
  const clean = input.replace(/^@/, '').replace(/\/$/, '');
  if (!/^[A-Za-z0-9._]{1,30}$/.test(clean)) return null;
  return `https://www.instagram.com/${clean}/`;
}

export function httpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}

export function telHref(phone) {
  if (!phone) return null;
  const input = String(phone).trim();
  const hasPlus = input.startsWith('+');
  const digits = input.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) return null;
  return `tel:${hasPlus ? '+' : ''}${digits}`;
}
