"use client";
const KEY = 'zyva.saved.v1';

export function getSavedIds() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function isSaved(id) {
  return getSavedIds().includes(id);
}

export function toggleSaved(id) {
  const ids = new Set(getSavedIds());
  if (ids.has(id)) ids.delete(id); else ids.add(id);
  const arr = [...ids];
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent('zyva:saved-changed'));
  return arr;
}
