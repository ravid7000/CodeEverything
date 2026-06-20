export type Team = { id?: string; name: string; logo?: string };

export type EventData = {
  id: string;
  listingId?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  league?: Team;
  startDate: string;
  isLive: boolean;
  renderHint?: 'SSR' | 'SSG' | 'ISR';
};

export type EventPageProps = {
  event: EventData;
  generatedAt: string;
};
