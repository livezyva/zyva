export function normalizeVenuePublicContacts(body = {}) {
  return {
    instagram_handle: normalizeInstagram(body.venue_instagram),
    facebook_url: normalizeFacebook(body.venue_facebook),
    website_url: normalizeWebsite(body.venue_website),
    phone: normalizePhone(body.venue_phone),
  };
}

function normalizeInstagram(value) {
  const input = optional(value);
  if (!input) return null;
  if (input.length > 2048) throw new Error('Instagram profile is too long.');
  let handle = input;
  if (/^(?:www\.)?instagram\.com\//i.test(handle)) handle = addHttps(handle);
  if (/^https?:\/\//i.test(handle)) {
    const url = safeUrl(handle, 'Instagram');
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host !== 'instagram.com') throw new Error('Instagram must be a valid instagram.com profile URL or @handle.');
    handle = url.pathname.split('/').filter(Boolean)[0] || '';
    if (['p', 'reel', 'reels', 'stories', 'explore', 'accounts'].includes(handle.toLowerCase())) {
      throw new Error('Instagram must link to the venue profile, not a post or Instagram page.');
    }
  }
  handle = handle.replace(/^@/, '').replace(/\/$/, '');
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    throw new Error('Instagram must be a valid profile handle or instagram.com URL.');
  }
  return `@${handle}`;
}

function normalizeFacebook(value) {
  const input = optional(value);
  if (!input) return null;
  if (input.length > 2048) throw new Error('Facebook page URL is too long.');
  const url = safeUrl(addHttps(input), 'Facebook');
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!(host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com')) {
    throw new Error('Facebook must be a valid facebook.com page URL.');
  }
  if (url.pathname === '/' && !url.search) {
    throw new Error('Facebook must link to the venue page.');
  }
  return url.toString();
}

function normalizeWebsite(value) {
  const input = optional(value);
  if (!input) return null;
  if (input.length > 2048) throw new Error('Website URL is too long.');
  return safeUrl(addHttps(input), 'Website').toString();
}

function normalizePhone(value) {
  const input = optional(value);
  if (!input) return null;
  if (input.length > 30 || !/^[+0-9()\-\s.]+$/.test(input)) {
    throw new Error('Public booking phone must be a valid phone number.');
  }
  const digits = input.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) {
    throw new Error('Public booking phone must contain between 6 and 15 digits.');
  }
  return input;
}

function optional(value) {
  return String(value || '').trim();
}

function addHttps(value) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function safeUrl(value, label) {
  let url;
  try { url = new URL(value); }
  catch { throw new Error(`${label} must be a valid URL.`); }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${label} URL must use http or https.`);
  }
  if (!url.hostname || url.username || url.password || !isPublicHostname(url.hostname)) {
    throw new Error(`${label} must be a valid public URL.`);
  }
  return url;
}

function isPublicHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host.includes('.') || host === 'localhost' || host.endsWith('.local') || host.includes(':')) return false;
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return true;
  const octets = host.split('.').map(Number);
  if (octets.some(value => value > 255)) return false;
  return !(octets[0] === 10 || octets[0] === 127 || octets[0] === 0 || octets[0] >= 224 ||
    (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 198 && (octets[1] === 18 || octets[1] === 19)) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31));
}
