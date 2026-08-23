-- Test data for Turn 2 (organizer flow) — insert fake pending applications
-- so you can practice the admin approval flow.
-- Run in Supabase SQL Editor AFTER turn2-migration.sql.
-- These use random UUIDs for user_id since they're not real users.

INSERT INTO organizer_applications (
  user_id, business_name, contact_name, contact_email, contact_phone,
  city, instagram_handle, facebook_url, website_url, message, status
) VALUES
  (gen_random_uuid(), 'Guaba Beach Bar', 'Yiannis Kyriakou', 'yiannis@guababeachbar.com', '+35796340000',
   'Limassol', '@guababeachbar', 'https://www.facebook.com/guababeachbar', 'https://www.guababeachbar.com',
   'We are the biggest beach bar in Limassol. Ready to list our weekly parties.', 'PENDING'),

  (gen_random_uuid(), 'Rialto Theatre', 'Katerina Loizidou', 'events@rialto.com.cy', '+35777777745',
   'Limassol', '@rialto.theatre', 'https://www.facebook.com/rialtotheatre', 'https://rialto.com.cy',
   'Official venue for Cyprus Film Days and other major cultural events.', 'PENDING'),

  (gen_random_uuid(), 'The Rockwood', 'Andreas Petrou', 'andreas@rockwoodnicosia.com', NULL,
   'Nicosia', '@rockwoodnicosia', NULL, NULL,
   NULL, 'PENDING')
ON CONFLICT DO NOTHING;
