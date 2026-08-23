// Cyprus-realistic seed data for ZYVA
const { randomUUID } = require('crypto');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function iso(date) { return date.toISOString(); }

// Anchor "now" — using a fixed reference so events are relative to current time when seeded
const now = new Date();
function daysFromNow(d, hour = 21, min = 0) {
  const x = new Date(now);
  x.setDate(x.getDate() + d);
  x.setHours(hour, min, 0, 0);
  return x;
}

// Real Cyprus event photos, served from /public/events (fast, no external deps)
const IMG = {
  club1:  '/events/club-uv.jpg',
  club2:  '/events/club-dj-crowd.jpg',
  club3:  '/events/club-dj-solo.jpg',
  club4:  '/events/club-dj-back.jpg',
  dj1:    '/events/club-uv.jpg',
  dj2:    '/events/club-dj-crowd.jpg',
  rest1:  '/events/food-meze-limassol.jpg',
  rest2:  '/events/food-taverna.jpg',
  rest3:  '/events/food-bbq.jpg',
  beach1: '/events/beach-nissi.jpg',
  beach2: '/events/beach-isola.jpg',
  beach3: '/events/beach-daybeds.png',
  fest1:  '/events/fest-paphos.jpg',
  fest2:  '/events/fest-stage-purple.jpg',
  fest3:  '/events/fest-theatre.jpg',
  cult1:  '/events/culture-cafe.jpg',
  cult2:  '/events/fest-acoustic.jpg',
  wine:   '/events/bar-cheers.jpg',
  jazz:   '/events/bar-rooftop.webp',
  cocktail: '/events/bar-cocktails.jpg',
  vip:    '/events/bar-vip.jpg',
  yoga:   '/events/culture-yoga.jpg',
  ledra:  '/events/culture-ledra.jpg',
  spread: '/events/food-spread.jpg',
};

const venuesRaw = [
  // Coordinates verified against OSM Nominatim / official venue listings — all on land.
  { name: 'Guaba Beach Bar', city: 'Limassol', address: 'Amathountos Ave 7, Agios Tychonas, Limassol', latitude: 34.702545, longitude: 33.107740,
    instagram_handle: '@guababeachbar', facebook_url: 'https://www.facebook.com/guababeachbar', website_url: 'https://www.guababeachbar.com', phone: '+35796340000' },
  { name: 'Notios Beach Club', city: 'Limassol', address: 'Amathus Beach Hotel, 75 Amathountos Ave, Limassol', latitude: 34.709194, longitude: 33.132894,
    instagram_handle: '@notios.beachclub', facebook_url: 'https://www.facebook.com/notiosbeachclub', website_url: 'https://notios.com.cy', phone: '+35725832000' },
  { name: 'Breeze Rooftop', city: 'Limassol', address: 'Limassol Marina, Old Port, Limassol', latitude: 34.669633, longitude: 33.040216,
    instagram_handle: '@breeze.rooftop', facebook_url: 'https://www.facebook.com/breezerooftop', website_url: 'https://breezerooftop.cy' },
  { name: 'Karma Sky Lounge', city: 'Limassol', address: 'Sfaellos 5, Limassol', latitude: 34.6825, longitude: 33.0472,
    instagram_handle: '@karmasky', facebook_url: 'https://www.facebook.com/karmaskylounge', phone: '+35799123456' },
  { name: 'To Kati Allo', city: 'Limassol', address: 'Christodoulou Chatzipavlou 46, Limassol', latitude: 34.676453, longitude: 33.048772,
    facebook_url: 'https://www.facebook.com/tokatiallolimassol', phone: '+35725381000' },
  { name: 'Ta Piatakia', city: 'Nicosia', address: 'Menandrou 8, Nicosia', latitude: 35.1731, longitude: 33.3625,
    instagram_handle: '@tapiatakianicosia', facebook_url: 'https://www.facebook.com/tapiatakia', phone: '+35722666700' },
  { name: 'Rooster Café', city: 'Nicosia', address: 'Onasagorou 76, Nicosia', latitude: 35.171879, longitude: 33.362062,
    instagram_handle: '@roostercyprus', facebook_url: 'https://www.facebook.com/roostercyprus', website_url: 'https://roostercyprus.com' },
  { name: 'The Rockwood', city: 'Nicosia', address: 'Stasikratous 26, Nicosia', latitude: 35.1706, longitude: 33.3620,
    instagram_handle: '@rockwoodnicosia', facebook_url: 'https://www.facebook.com/therockwoodcy' },
  { name: 'Muse Kitchen & Bar', city: 'Paphos', address: 'Poseidonos Ave, Kato Paphos', latitude: 34.7742, longitude: 32.4267,
    instagram_handle: '@musepaphos', facebook_url: 'https://www.facebook.com/musepaphos', website_url: 'https://musepaphos.com', phone: '+35726222567' },
  { name: 'Aliada Beach', city: 'Paphos', address: 'Coral Bay Ave, Peyia', latitude: 34.853794, longitude: 32.369932,
    instagram_handle: '@aliadabeach', facebook_url: 'https://www.facebook.com/aliadabeach' },
  { name: 'Ammos Beach Restaurant', city: 'Larnaca', address: 'Mackenzie Beach, Larnaca', latitude: 34.890529, longitude: 33.638118,
    instagram_handle: '@ammosbeachrestaurant', facebook_url: 'https://www.facebook.com/ammoslarnaca', website_url: 'https://ammosrestaurant.com.cy', phone: '+35724828844' },
  { name: 'Militzis Tavern', city: 'Larnaca', address: 'Piyale Pasa 42, Larnaca', latitude: 34.907981, longitude: 33.637650,
    facebook_url: 'https://www.facebook.com/militzisrestaurant', website_url: 'https://militzis.com', phone: '+35724655867' },
  { name: 'Guaba Ayia Napa', city: 'Ayia Napa', address: 'Nissi Ave, Ayia Napa', latitude: 34.9860, longitude: 33.9720,
    instagram_handle: '@ayianapaparty', facebook_url: 'https://www.facebook.com/guabaayianapa' },
  { name: 'Castle Club', city: 'Ayia Napa', address: 'Louka Louka 20/22 (Grigori Afxentiou), Ayia Napa', latitude: 34.989802, longitude: 33.998089,
    instagram_handle: '@castleclubayianapa', facebook_url: 'https://www.facebook.com/CastleClubAyiaNapa', website_url: 'https://castleclub.com.cy' },
  { name: 'Vamos Beach', city: 'Ayia Napa', address: 'Nissi Beach, Ayia Napa', latitude: 34.987485, longitude: 33.967802,
    instagram_handle: '@vamosbeach', facebook_url: 'https://www.facebook.com/vamosbeachcy' },
  { name: 'Rialto Theatre', city: 'Limassol', address: 'Andrea Drousioti 19, Limassol', latitude: 34.679552, longitude: 33.045788,
    instagram_handle: '@rialto.theatre', facebook_url: 'https://www.facebook.com/rialtotheatre', website_url: 'https://rialto.com.cy', phone: '+35777777745' },
  { name: 'Kala Kathoumena', city: 'Nicosia', address: 'Nikokleous 21, Old Nicosia', latitude: 35.1740, longitude: 33.3618,
    instagram_handle: '@kalakathoumena', facebook_url: 'https://www.facebook.com/kalakathoumena' },
  { name: 'Medieval Castle Grounds', city: 'Paphos', address: 'Paphos Harbour Castle, Paphos', latitude: 34.753670, longitude: 32.406959,
    website_url: 'https://www.aphrodite-festival.org' },
];

const seedVenues = venuesRaw.map(v => ({
  id: randomUUID(),
  logo_url: null,
  instagram_handle: v.instagram_handle || null,
  facebook_url: v.facebook_url || null,
  website_url: v.website_url || null,
  phone: v.phone || null,
  is_verified: 1,
  slug: slugify(v.name),
  ...v,
}));

function venueId(name) { return seedVenues.find(v => v.name === name).id; }

const eventsRaw = [
  // TONIGHT — Limassol
  {
    venue: 'Guaba Beach Bar', title: 'Guaba Sunset Sessions ft. Nervo',
    category: 'Beach Bars', price_label: '€25 Entry',
    startOffset: 0, startHour: 20, durHours: 6,
    image: IMG.beach1, is_featured: 1,
    description: 'The signature sunset session returns. Deep house and melodic techno by the water until sunrise. Free-flow cocktails from 8pm to 10pm. Dress code: beach-chic.',
  },
  {
    venue: 'Breeze Rooftop', title: 'Rooftop Cocktails & Live Jazz',
    category: 'Cultural & Pop-ups', price_label: '€15 Entry',
    startOffset: 0, startHour: 21, durHours: 4,
    image: IMG.cocktail,
    description: 'Weekly live jazz trio with panoramic views over Limassol Marina. Craft cocktails and a small-plates menu curated by Chef Andreou.',
  },
  {
    venue: 'To Kati Allo', title: 'Meze & Zivania Feast',
    category: 'Restaurants & Dining', price_label: '€30 pp',
    startOffset: 0, startHour: 19, durHours: 3,
    image: IMG.rest1,
    description: '18-course traditional Cypriot meze with unlimited house wine and zivania. Reservation required.',
  },
  // TOMORROW
  {
    venue: 'Karma Sky Lounge', title: 'Karma Wednesdays: Afro House',
    category: 'Clubs & Nightlife', price_label: '€20 Entry',
    startOffset: 1, startHour: 23, durHours: 5,
    image: IMG.club1, is_featured: 1,
    description: 'Resident DJs Marco V and Elena Katri bring the finest Afro House selection. Bottle service from €120.',
  },
  {
    venue: 'Rooster Café', title: 'Nicosia Open Mic',
    category: 'Cultural & Pop-ups', price_label: 'Free Entry',
    startOffset: 1, startHour: 20, durHours: 3,
    image: IMG.cult1,
    description: 'Poetry, acoustic sets, comedy — sign up at the bar from 7pm. Free entry, drinks specials all night.',
  },
  {
    venue: 'Ammos Beach Restaurant', title: 'Sunrise Yoga & Brunch',
    category: 'Cultural & Pop-ups', price_label: '€35',
    startOffset: 1, startHour: 8, durHours: 3,
    image: IMG.yoga,
    description: '75-minute Vinyasa flow on the sand followed by a Mediterranean brunch buffet. Mats provided.',
  },
  // THIS WEEKEND
  {
    venue: 'Notios Beach Club', title: 'White Party — Ibiza Edition',
    category: 'Beach Bars', price_label: '€40 Entry',
    startOffset: 3, startHour: 22, durHours: 7,
    image: IMG.beach3, is_featured: 1,
    description: 'Dress code strictly white. Line-up: Solomun (b2b) & Dixon. Two dancefloors, sushi bar, and cabanas from €400.',
  },
  {
    venue: 'Guaba Ayia Napa', title: 'Napa Beach Rave — Day & Night',
    category: 'Clubs & Nightlife', price_label: '€35 Early Bird',
    startOffset: 4, startHour: 14, durHours: 12,
    image: IMG.club3,
    description: '12 hours non-stop on Nissi Beach. Three stages: Main Stage (Techno), Sunset Stage (House), Chill Dome (Downtempo).',
  },
  {
    venue: 'Castle Club', title: 'Castle Club Season Opening',
    category: 'Clubs & Nightlife', price_label: '€30 Entry',
    startOffset: 5, startHour: 23, durHours: 6,
    image: IMG.club4,
    description: 'The largest club in Ayia Napa opens its doors for the summer. Special guest: MK. Four rooms, four vibes.',
  },
  {
    venue: 'Medieval Castle Grounds', title: 'Paphos Ancient Odeon Concert',
    category: 'Cultural & Pop-ups', price_label: '€22',
    startOffset: 4, startHour: 20, durHours: 2,
    image: IMG.cult2,
    description: 'The Cyprus Symphony Orchestra performs Beethoven\'s 9th under the stars at the Paphos Ancient Odeon.',
  },
  {
    venue: 'Muse Kitchen & Bar', title: 'Sunset Wine Tasting',
    category: 'Restaurants & Dining', price_label: '€45 pp',
    startOffset: 3, startHour: 19, durHours: 3,
    image: IMG.wine,
    description: '6 Cypriot wines paired with local cheese and charcuterie. Led by sommelier Katerina Iacovou.',
  },
  {
    venue: 'Aliada Beach', title: 'Beach Bonfire & Reggae Night',
    category: 'Beach Bars', price_label: 'Free Entry',
    startOffset: 5, startHour: 20, durHours: 5,
    image: IMG.beach1,
    description: 'Bonfire, live reggae, and cocktails on Coral Bay. Bring a blanket. Bar open until 1am.',
  },
  // UPCOMING (next 1–3 weeks)
  {
    venue: 'Rialto Theatre', title: 'Cyprus Film Days International',
    category: 'Festivals & Concerts', price_label: '€8 per screening',
    startOffset: 8, startHour: 18, durHours: 4,
    image: IMG.fest1, is_featured: 1,
    description: 'Six days of the best international cinema. Opening night: "The Weight of Water" (Cyprus premiere) with Q&A.',
  },
  {
    venue: 'Vamos Beach', title: 'Sunrise Techno Marathon',
    category: 'Clubs & Nightlife', price_label: '€50',
    startOffset: 10, startHour: 4, durHours: 10,
    image: IMG.dj1,
    description: '10 hours of pure techno starting at 4am. Amelie Lens, Charlotte de Witte b2b, and locals. Beach breakfast included.',
  },
  {
    venue: 'Ta Piatakia', title: 'Guest Chef Series: Argiro Barbarigou',
    category: 'Restaurants & Dining', price_label: '€75 pp',
    startOffset: 12, startHour: 20, durHours: 3,
    image: IMG.rest2,
    description: 'One-night-only 7-course tasting by celebrated Greek chef Argiro Barbarigou. 24 seats. Wine pairing +€35.',
  },
  {
    venue: 'The Rockwood', title: 'Rockwood Vinyl Sundays',
    category: 'Clubs & Nightlife', price_label: 'Free Entry',
    startOffset: 6, startHour: 19, durHours: 5,
    image: IMG.dj2,
    description: 'Deep house, disco, and rare grooves — all vinyl, all night. Rotating guest selectors from Athens & Berlin.',
  },
  {
    venue: 'Militzis Tavern', title: 'Kleftiko Sunday Long Lunch',
    category: 'Restaurants & Dining', price_label: '€28 pp',
    startOffset: 6, startHour: 13, durHours: 4,
    image: IMG.rest3,
    description: 'Slow-cooked lamb kleftiko straight from the traditional clay oven. Live bouzouki from 3pm.',
  },
  {
    venue: 'Kala Kathoumena', title: 'Old Nicosia Street Food Fest',
    category: 'Festivals & Concerts', price_label: 'Free Entry',
    startOffset: 14, startHour: 17, durHours: 6,
    image: IMG.ledra,
    description: '30+ street food vendors across Ledra & Onasagorou. Live music, craft beer garden, and Cypriot artisan market.',
  },
  {
    venue: 'Guaba Beach Bar', title: 'Full Moon Party — August Edition',
    category: 'Beach Bars', price_label: '€30 Entry',
    startOffset: 18, startHour: 21, durHours: 8,
    image: IMG.beach2,
    description: 'The legendary Full Moon returns. Fire dancers, UV body art station, and 5 international DJs across the night.',
    is_featured: 1,
  },
  {
    venue: 'Medieval Castle Grounds', title: 'Paphos Aphrodite Opera Festival',
    category: 'Festivals & Concerts', price_label: '€60',
    startOffset: 20, startHour: 20, durHours: 3,
    image: IMG.fest3, is_featured: 1,
    description: 'The 26th Aphrodite Festival presents "Aida" at the Medieval Castle. A once-a-year cultural event.',
  },
  {
    venue: 'Notios Beach Club', title: 'Notios Brunch & Beats',
    category: 'Beach Bars', price_label: '€55 pp',
    startOffset: 7, startHour: 12, durHours: 5,
    image: IMG.spread,
    description: 'Bottomless brunch with Med sharing plates and prosecco. House DJ from 2pm. Sun-beds included.',
  },
];

const seedEvents = eventsRaw.map(e => {
  const start = daysFromNow(e.startOffset, e.startHour, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + e.durHours);
  const venue = seedVenues.find(v => v.name === e.venue);
  const duration = 7;
  return {
    id: randomUUID(),
    venue_id: venue.id,
    title: e.title,
    slug: slugify(e.title) + '-' + Math.random().toString(36).slice(2, 6),
    description: e.description,
    category: e.category,
    city: venue.city,
    venue_name: venue.name,
    address: venue.address,
    latitude: venue.latitude,
    longitude: venue.longitude,
    start_datetime: iso(start),
    end_datetime: iso(end),
    cover_image_url: e.image,
    gallery_urls: null,
    ticket_url: 'https://example.com/tickets',
    price_label: e.price_label,
    status: 'APPROVED_ACTIVE',
    is_featured: e.is_featured || 0,
    listing_duration_days: duration,
    daily_rate_eur: 5.0,
    total_cost_eur: duration * 5.0,
    views_count: Math.floor(Math.random() * 900) + 40,
    shares_count: Math.floor(Math.random() * 60),
    expires_at: iso(daysFromNow(e.startOffset + duration, 23, 59)),
  };
});

module.exports = { seedVenues, seedEvents };
