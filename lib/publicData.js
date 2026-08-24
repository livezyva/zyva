export const PUBLIC_EVENT_FIELDS = [
  'id', 'venue_id', 'title', 'slug', 'description', 'description_el',
  'category', 'city', 'venue_name', 'address', 'latitude', 'longitude',
  'start_datetime', 'end_datetime', 'cover_image_url', 'gallery_urls',
  'ticket_url', 'price_label', 'is_featured', 'views_count', 'shares_count',
];

export const PUBLIC_VENUE_FIELDS = [
  'id', 'name', 'slug', 'logo_url', 'city', 'address', 'latitude', 'longitude',
  'instagram_handle', 'facebook_url', 'website_url', 'phone', 'is_verified',
];

export function publicEventSelect(alias = '') {
  const prefix = alias ? `${alias}.` : '';
  return PUBLIC_EVENT_FIELDS.map(field => `${prefix}${field}`).join(', ');
}

export function publicVenueSelect(alias = '') {
  const prefix = alias ? `${alias}.` : '';
  return PUBLIC_VENUE_FIELDS.map(field => `${prefix}${field}`).join(', ');
}
