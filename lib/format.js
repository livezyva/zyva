export function formatEventTime(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const now = new Date();
  const isToday = s.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = s.toDateString() === tomorrow.toDateString();
  const dayLabel = isToday ? 'Tonight' : isTomorrow ? 'Tomorrow' : s.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endTime = e.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return { dayLabel, time, endTime, isToday };
}

export function relativeCountdown(startIso) {
  const s = new Date(startIso);
  const now = new Date();
  const diffMs = s - now;
  if (diffMs < 0) return 'Happening now';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Starts in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Starts in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return `In ${days}d`;
}

export const CATEGORY_META = {
  'Clubs & Nightlife':    { emoji: '🎧', short: 'Clubs' },
  'Live Music':           { emoji: '🎸', short: 'Live Music' },
  'Bars':                 { emoji: '🍹', short: 'Bars' },
  'Restobar':             { emoji: '🍸', short: 'Restobar' },
  'Restaurants & Dining': { emoji: '🍽️', short: 'Dining' },
  'Beach Bars':           { emoji: '🏝️', short: 'Beach' },
  'Festivals & Concerts': { emoji: '🎪', short: 'Festivals' },
  'Cultural & Pop-ups':   { emoji: '🎭', short: 'Culture' },
};
