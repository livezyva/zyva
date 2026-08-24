"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { categoryLabels, categoryShortLabels, cityLabels, interpolate, translations } from '../lib/i18n';

const STORAGE_KEY = 'zyva-language';
const LanguageContext = createContext(null);

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next = stored === 'el' ? 'el' : 'en';
    setLanguageState(next);
    document.documentElement.lang = next;
    setReady(true);
  }, []);

  const setLanguage = useCallback((next) => {
    const safe = next === 'el' ? 'el' : 'en';
    setLanguageState(safe);
    window.localStorage.setItem(STORAGE_KEY, safe);
    document.documentElement.lang = safe;
    window.dispatchEvent(new CustomEvent('zyva:language-changed', { detail: safe }));
  }, []);

  const value = useMemo(() => {
    const t = (key, values) => {
      const template = translations[language]?.[key] ?? translations.en[key] ?? key;
      return interpolate(template, values);
    };
    const categoryName = (category) => categoryLabels[language]?.[category] || category;
    const categoryShort = (category) => categoryShortLabels[language]?.[category] || category;
    const cityName = (city) => cityLabels[language]?.[city] || city;
    const priceLabel = (price) => /^free entry$/i.test(String(price || '').trim()) ? t('common.freeEntry') : price;
    const eventDescription = (event) => language === 'el' && event?.description_el?.trim()
      ? event.description_el
      : event?.description;
    const locale = language === 'el' ? 'el-GR' : 'en-GB';
    const localizeError = (error, fallbackKey = 'errors.generic') => {
      const message = error?.message || String(error || '');
      if (language !== 'el') return message || t(fallbackKey);
      const rules = [
        [/failed to submit/i, 'apply.failed'],
        [/failed to save/i, 'form.saveFailed'],
        [/upload failed/i, 'form.uploadFailed'],
        [/network|fetch/i, 'auth.networkError'],
        [/invalid.*credentials/i, 'auth.wrongCredentials'],
        [/email.*not.*confirmed/i, 'auth.confirmFirst'],
        [/already.*registered/i, 'auth.alreadyRegistered'],
        [/not signed in/i, 'errors.notSignedIn'],
        [/organizer access required/i, 'errors.organizerAccess'],
        [/admin access required/i, 'errors.adminAccess'],
        [/translation.*not.*configured|greek description is empty/i, 'errors.translationMissing'],
        [/translation failed|translation service|empty greek description/i, 'errors.translationFailed'],
      ];
      const match = rules.find(([pattern]) => pattern.test(message));
      return match ? t(match[1]) : (message || t(fallbackKey));
    };
    return {
      language, setLanguage, ready, t, locale,
      categoryName, categoryShort, cityName, priceLabel, eventDescription, localizeError,
    };
  }, [language, ready, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
