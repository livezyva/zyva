// Server-side address geocoding via OpenStreetMap Nominatim.
// Free, no API key. Rate-limited to 1 request/second per Nominatim's ToS.
// Returns { lat, lng } or null if not found.

export async function geocodeAddress(address, city, countryCode = 'cy') {
  if (!address) return null;

  const queries = [
    // Most specific first
    `${address}, ${city}, Cyprus`,
    `${address}, Cyprus`,
    // Address alone (in case city is in address string)
    `${address}`,
    // Fallback: just the city
    `${city}, Cyprus`,
  ].filter(Boolean);

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
        q,
        format: 'json',
        limit: '1',
        countrycodes: countryCode,
        addressdetails: '0',
      });

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ZYVA-Cyprus-Events/1.0 (livezyva@gmail.com)',
          'Accept': 'application/json',
        },
        // 5s timeout
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, matched: q };
        }
      }
    } catch (err) {
      console.warn('[geocode] attempt failed for:', q, err?.message);
      continue;
    }
  }

  return null;
}
