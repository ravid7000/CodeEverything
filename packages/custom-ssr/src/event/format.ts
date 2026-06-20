const TEXT: Record<string, string> = {
  RECORD: 'Record',
  REMOVE: 'Remove',
  LIVE: 'Live Now',
};

export const getText = (key: string) => TEXT[key] ?? key;

export const slug = (value?: string) =>
  (value || '').toLowerCase().replace(/\s+/g, '-');

/** Stable status for SSR + hydration using server anchor time, not client clock. */
export function statusAt(
  isLive: boolean,
  startDate: Date,
  referenceNowIso: string,
): string {
  if (isLive) return getText('LIVE');
  const reference = new Date(referenceNowIso).getTime();
  return startDate.getTime() < reference ? 'Started' : 'Upcoming';
}

/** Fixed UTC formatting so Node and browser produce the same string. */
export function formatTimeUtc(date: Date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDuration(ms: number) {
  if (ms <= 0) return 'Started';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function startingSoonAt(startDate: Date, referenceNowIso: string) {
  const reference = new Date(referenceNowIso).getTime();
  return startDate.getTime() - reference < 3_600_000;
}
