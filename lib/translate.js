const GOOGLE_TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Translate an English event description to Greek on the server.
 * The API key must exist only as a server/runtime secret; never expose it as NEXT_PUBLIC_*.
 */
export async function translateDescriptionToGreek(text) {
  const sourceText = String(text || '').trim();
  if (!sourceText) return null;

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    const error = new Error(
      'Greek description is empty. Add the Greek description manually before approval.'
    );
    error.code = 'TRANSLATION_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: sourceText, source: 'en', target: 'el', format: 'text' }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Automatic Greek translation failed. Add the Greek description manually and try again.');
    error.code = 'TRANSLATION_FAILED';
    throw error;
  }

  const translated = payload?.data?.translations?.[0]?.translatedText?.trim();
  if (!translated) {
    const error = new Error('The translation service returned an empty Greek description. Add it manually and try again.');
    error.code = 'TRANSLATION_EMPTY';
    throw error;
  }
  return decodeHtmlEntities(translated);
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
