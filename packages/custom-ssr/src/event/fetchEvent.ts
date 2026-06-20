import type { EventData, EventPageProps } from './types';

export async function fetchEvent(id: string): Promise<EventData> {
  return {
    id,
    listingId: `listing-${id}`,
    homeTeam: { id: 'h1', name: 'Lions' },
    awayTeam: { id: 'a1', name: 'Bears' },
    league: { id: 'l1', name: 'Premier League' },
    startDate: new Date(Date.now() + 7_200_000).toISOString(),
    isLive: false,
    renderHint: 'SSR',
  };
}

export async function buildEventPageProps(id: string): Promise<EventPageProps> {
  return {
    event: await fetchEvent(id),
    generatedAt: new Date().toISOString(),
  };
}
