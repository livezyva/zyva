"use client";
import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import { uploadCoverImage } from '../../lib/upload';
import { useLanguage } from '../LanguageProvider';

const CATEGORIES = [
  'Clubs & Nightlife',
  'Live Music',
  'Bars',
  'Restobar',
  'Restaurants & Dining',
  'Beach Bars',
  'Festivals & Concerts',
  'Cultural & Pop-ups',
];
const CITIES = ['Limassol', 'Nicosia', 'Paphos', 'Larnaca', 'Ayia Napa'];
const DEFAULT_IMAGES = [
  '/events/club-uv.jpg', '/events/club-dj-crowd.jpg', '/events/club-dj-back.jpg',
  '/events/beach-nissi.jpg', '/events/beach-isola.jpg', '/events/beach-daybeds.png',
  '/events/food-meze-limassol.jpg', '/events/food-taverna.jpg', '/events/food-bbq.jpg',
  '/events/bar-cocktails.jpg', '/events/bar-cheers.jpg', '/events/bar-rooftop.webp',
  '/events/fest-paphos.jpg', '/events/fest-stage-purple.jpg', '/events/fest-theatre.jpg',
  '/events/culture-cafe.jpg', '/events/culture-ledra.jpg', '/events/culture-yoga.jpg',
];

/**
 * Modal event form. `initial` = event to edit (or null for new).
 * `venues` = array of existing venues (for the picker).
 * `asOrganizer` = if true, POST to /api/organizer/events (goes to PENDING_APPROVAL)
 *                 instead of /api/admin/events (auto-approve).
 */
export default function EventForm({ initial, venues, onClose, onSaved, asOrganizer = false }) {
  const { t, categoryName, cityName, localizeError } = useLanguage();
  const isEdit = !!initial;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [contactName, setContactName]   = useState(initial?.contact_name || '');
  const [contactEmail, setContactEmail] = useState(initial?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone || '');

  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url || DEFAULT_IMAGES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadCoverImage(file, { onProgress: setUploadProgress });
      setCoverUrl(url);
    } catch (err) {
      setUploadError(localizeError(err, 'form.uploadFailed'));
    } finally {
      setUploading(false);
      // Reset the input so picking the same file twice still fires onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [venueId, setVenueId] = useState(initial?.venue_id || (venues[0]?.id ?? ''));
  const [customVenue, setCustomVenue] = useState(!initial?.venue_id);
  const [venueName, setVenueName] = useState(initial?.venue_name || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [city, setCity] = useState(initial?.city || 'Limassol');
  const [lat, setLat] = useState(initial?.latitude ?? '');
  const [lng, setLng] = useState(initial?.longitude ?? '');
  const [startDt, setStartDt] = useState(toDatetimeLocal(initial?.start_datetime) || defaultStart());
  const [endDt, setEndDt]     = useState(toDatetimeLocal(initial?.end_datetime)   || defaultEnd());

  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [priceLabel, setPriceLabel] = useState(initial?.price_label || 'Free Entry');
  const [ticketUrl, setTicketUrl] = useState(initial?.ticket_url || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [descriptionGreek, setDescriptionGreek] = useState(initial?.description_el || '');
  const [isFeatured, setIsFeatured] = useState(!!initial?.is_featured);

  // Autofill venue fields when picking a saved venue
  useEffect(() => {
    if (customVenue) return;
    const v = venues.find(x => x.id === venueId);
    if (v) {
      setVenueName(v.name); setAddress(v.address); setCity(v.city);
      setLat(v.latitude ?? ''); setLng(v.longitude ?? '');
    }
  }, [venueId, customVenue, venues]);

  const goto = (n) => { setError(null); setStep(n); };
  const next = () => { if (validate(step)) goto(step + 1); };
  const back = () => goto(Math.max(1, step - 1));

  const validate = (s) => {
    if (s === 1) {
      if (!contactName.trim() || !contactEmail.trim()) { setError(t('form.errContact')); return false; }
    }
    if (s === 2) { if (!coverUrl) { setError(t('form.errCover')); return false; } }
    if (s === 3) {
      if (!venueName.trim() || !address.trim() || !city) { setError(t('form.errVenue')); return false; }
      if (!startDt || !endDt) { setError(t('form.errDates')); return false; }
      if (new Date(endDt) <= new Date(startDt)) { setError(t('form.errEnd')); return false; }
    }
    if (s === 4) {
      if (!title.trim()) { setError(t('form.errTitle')); return false; }
      if (!description.trim() || description.length < 20) { setError(t('form.errDescription')); return false; }
    }
    return true;
  };

  const save = async () => {
    if (!validate(4)) return;
    setSaving(true); setError(null);
    try {
      const body = {
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || null,
        cover_image_url: coverUrl.trim(),
        venue_id: customVenue ? null : venueId,
        venue_name: venueName.trim(),
        address: address.trim(),
        city,
        latitude: lat === '' ? null : Number(lat),
        longitude: lng === '' ? null : Number(lng),
        start_datetime: new Date(startDt).toISOString(),
        end_datetime: new Date(endDt).toISOString(),
        title: title.trim(),
        category,
        price_label: priceLabel.trim() || 'Free Entry',
        ticket_url: ticketUrl.trim() || null,
        description: description.trim(),
        description_el: descriptionGreek.trim() || null,
        is_featured: asOrganizer ? false : isFeatured,
        status: asOrganizer ? 'PENDING_APPROVAL' : 'APPROVED_ACTIVE',
      };
      const url = isEdit
        ? `/api/admin/events/${initial.id}`
        : (asOrganizer ? '/api/organizer/events' : '/api/admin/events');
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await authedFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t('form.saveFailed'));
      onSaved?.(data);
    } catch (e) { setError(localizeError(e, 'form.saveFailed')); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-zcard border border-zborder rounded-3xl shadow-2xl shadow-black/80 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zborder">
          <div>
            <div className="text-ztext3 text-xs uppercase tracking-wider">{t('form.step', { step })}</div>
            <div className="font-headline text-xl font-bold">
              {isEdit ? t('form.editEvent') : t('form.addEvent')}
            </div>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-ztext2 hover:text-white h-8 w-8 grid place-items-center rounded-full hover:bg-white/5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-1 px-5 pt-3">
          {[1,2,3,4].map(n => (
            <button key={n} onClick={() => goto(n)}
              className={`h-1 flex-1 rounded-full transition ${n <= step ? 'bg-zneon' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {step === 1 && (
            <Section title={t('form.contactTitle')} hint={t('form.contactHint')}>
              <Field label={t('form.fullName')}>
                <input className="input" value={contactName} onChange={e => setContactName(e.target.value)} placeholder={t('form.fullNamePlaceholder')} />
              </Field>
              <Field label={t('form.email')}>
                <input type="email" className="input" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder={t('form.emailPlaceholder')} />
              </Field>
              <Field label={t('form.phone')}>
                <input className="input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder={t('form.phonePlaceholder')} />
              </Field>
            </Section>
          )}

          {step === 2 && (
            <Section title={t('form.coverTitle')} hint={t('form.coverHint')}>
              {/* Upload button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFilePick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-zneon text-black font-bold px-5 py-3 rounded-xl shadow-neonSoft hover:shadow-neon transition disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      {t('form.uploading', { progress: uploadProgress })}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      </svg>
                      {t('form.uploadPhoto')}
                    </>
                  )}
                </button>
                {uploadError && (
                  <div className="text-red-400 text-xs mt-2 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
                    {uploadError}
                  </div>
                )}
                <div className="text-ztext3 text-[11px] mt-1.5">
                  {t('form.uploadHelp')}
                </div>
              </div>

              {/* Preview */}
              {coverUrl && (
                <div>
                  <div className="text-ztext3 text-xs uppercase tracking-wider mb-2">{t('form.preview')}</div>
                  <div className="rounded-xl overflow-hidden border border-zborder aspect-[16/9] bg-black">
                    <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Or paste URL */}
              <details className="text-sm">
                <summary className="cursor-pointer text-ztext2 hover:text-white text-xs">
                  {t('form.pasteImage')}
                </summary>
                <div className="mt-2">
                  <input
                    className="input"
                    value={coverUrl}
                    onChange={e => setCoverUrl(e.target.value)}
                    placeholder={t('form.coverUrlPlaceholder')}
                  />
                </div>
              </details>

              {/* Sample gallery */}
              <details className="text-sm">
                <summary className="cursor-pointer text-ztext2 hover:text-white text-xs">
                  {t('form.samplePhoto')}
                </summary>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {DEFAULT_IMAGES.map(src => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setCoverUrl(src)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                        coverUrl === src ? 'border-zneon shadow-neonSoft' : 'border-transparent hover:border-zborder'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </details>
            </Section>
          )}

          {step === 3 && (
            <Section title={t('form.whenWhereTitle')} hint={t('form.whenWhereHint')}>
              <div className="flex items-center gap-3 text-xs text-ztext2 mb-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!customVenue}
                    onChange={() => setCustomVenue(false)}
                    className="accent-zneon"
                  />
                  {t('form.existingVenue')}
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={customVenue}
                    onChange={() => setCustomVenue(true)}
                    className="accent-zneon"
                  />
                  {t('form.newVenue')}
                </label>
              </div>

              {!customVenue ? (
                <Field label={t('form.venue')}>
                  <select className="input" value={venueId} onChange={e => setVenueId(e.target.value)}>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name} — {cityName(v.city)}</option>
                    ))}
                  </select>
                </Field>
              ) : (
                <>
                  <Field label={t('form.venueName')}>
                    <input className="input" value={venueName} onChange={e => setVenueName(e.target.value)} placeholder={t('form.venueNamePlaceholder')} />
                  </Field>
                  <Field label={t('form.address')}>
                    <input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder={t('form.addressPlaceholder')} />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label={t('form.city')}>
                      <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                        {CITIES.map(c => <option key={c} value={c}>{cityName(c)}</option>)}
                      </select>
                    </Field>
                    <Field label={t('form.latitude')}>
                      <input className="input" value={lat} onChange={e => setLat(e.target.value)} placeholder={t('form.latitudePlaceholder')} />
                    </Field>
                    <Field label={t('form.longitude')}>
                      <input className="input" value={lng} onChange={e => setLng(e.target.value)} placeholder={t('form.longitudePlaceholder')} />
                    </Field>
                  </div>
                  <div className="text-ztext3 text-[11px] bg-zneon/5 border border-zneon/20 rounded-lg p-2">
                    💡 <strong>{t('form.locationTipStrong')}</strong> {t('form.locationTip')}
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Field label={t('form.start')}>
                  <input type="datetime-local" className="input" value={startDt} onChange={e => setStartDt(e.target.value)} />
                </Field>
                <Field label={t('form.end')}>
                  <input type="datetime-local" className="input" value={endDt} onChange={e => setEndDt(e.target.value)} />
                </Field>
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title={t('form.detailsTitle')} hint={t('form.detailsHint')}>
              <Field label={t('form.title')}>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('form.titlePlaceholder')} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('form.category')}>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{categoryName(c)}</option>)}
                  </select>
                </Field>
                <Field label={t('form.price')}>
                  <input className="input" value={priceLabel} onChange={e => setPriceLabel(e.target.value)} placeholder={t('form.pricePlaceholder')} />
                </Field>
              </div>
              <Field label={t('form.ticket')}>
                <input className="input" value={ticketUrl} onChange={e => setTicketUrl(e.target.value)} placeholder={t('form.ticketPlaceholder')} />
              </Field>
              <Field label={t('form.description')}>
                <textarea rows={5} className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('form.descriptionPlaceholder')} />
                <div className="text-ztext3 text-[11px] mt-1">{t('form.characters', { count: description.length })}</div>
              </Field>
              <Field label={t('form.descriptionGreek')}>
                <textarea rows={5} lang="el" className="input" value={descriptionGreek} onChange={e => setDescriptionGreek(e.target.value)} placeholder={t('form.descriptionGreekPlaceholder')} />
                <div className="text-ztext3 text-[11px] mt-1">{t('form.greekHelp')}</div>
              </Field>
              {!asOrganizer && (
                <label className="inline-flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="accent-zneon" />
                  {t('form.recommended')}
                </label>
              )}
              {asOrganizer && (
                <div className="text-ztext3 text-xs bg-white/5 border border-zborder rounded-lg p-3">
                  {t('form.reviewNotice')}
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zborder">
          <button
            onClick={step === 1 ? onClose : back}
            className="px-4 py-2 rounded-full border border-zborder text-white hover:border-zneon hover:text-zneon transition text-sm"
          >
            {step === 1 ? t('common.cancel') : t('common.back')}
          </button>
          {step < 4 ? (
            <button onClick={next} className="px-5 py-2 rounded-full bg-zneon text-black font-bold hover:shadow-neonSoft transition">
              {t('common.next')}
            </button>
          ) : (
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-full bg-zneon text-black font-bold hover:shadow-neon transition disabled:opacity-60"
            >
              {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : (asOrganizer ? t('form.submitReview') : t('form.createEvent'))}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: rgba(0,0,0,0.55);
          border: 1px solid #222;
          border-radius: 0.75rem;
          padding: 0.6rem 0.9rem;
          color: #fff;
          font-size: 0.9rem;
        }
        .input:focus { outline: none; border-color: #1DB954; box-shadow: 0 0 12px rgba(29,185,84,0.25); }
        .input::placeholder { color: #666; }
      `}</style>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="font-headline font-bold text-lg">{title}</div>
        {hint && <div className="text-ztext3 text-xs">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-ztext3 text-xs uppercase tracking-wider mb-1">{label}</div>
      {children}
    </label>
  );
}

async function authedFetch(url, opts = {}) {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...opts, headers });
}

function defaultStart() {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}
function defaultEnd() {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(23, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}
function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
