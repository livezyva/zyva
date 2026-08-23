// Client-side image upload to Supabase Storage bucket "event-covers".
// Requires the bucket to exist and have public read + authenticated insert policies.
// See SETUP-STORAGE.md for one-time Supabase setup.
import { getBrowserSupabase } from './supabase';

const BUCKET = 'event-covers';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB hard limit before compression

/**
 * Downscale + compress an image on the client BEFORE upload.
 * - Max longest side: 1600px (plenty for event covers, saves bandwidth)
 * - Output: JPEG quality 0.82 (best size/quality balance for photos)
 */
async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('Please pick an image file (JPG or PNG).');

  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
    im.src = url;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error('Compression failed.')),
      'image/jpeg',
      quality
    );
  });
  return blob;
}

/**
 * Upload an image File to Supabase Storage.
 * Returns a public URL string.
 */
export async function uploadCoverImage(file, { onProgress } = {}) {
  if (!file) throw new Error('No file selected.');
  if (file.size > MAX_BYTES) throw new Error('File too big (max 5 MB before compression).');

  const supabase = getBrowserSupabase();
  onProgress?.(10);

  // Compress client-side
  const compressed = await compressImage(file);
  onProgress?.(40);

  // Path: {timestamp}-{random}.jpg (avoids collisions, no user data leaks)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, compressed, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });
  if (error) throw new Error(error.message || 'Upload failed.');
  onProgress?.(90);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  onProgress?.(100);
  return data.publicUrl;
}
