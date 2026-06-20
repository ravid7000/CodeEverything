import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EventPage } from './EventPage';
import type { EventPageProps } from './types';

async function fetchEventPageClient(id: string): Promise<EventPageProps> {
  const res = await fetch(`/api/event/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to load event');
  return res.json();
}

export function EventRoute({ serverData }: { serverData?: EventPageProps }) {
  const { id = 'evt-1' } = useParams();
  const ssrMatches = serverData?.event.id === id;

  const [data, setData] = useState<EventPageProps | undefined>(
    ssrMatches ? serverData : undefined,
  );
  const [loading, setLoading] = useState(!ssrMatches);
  const [error, setError] = useState('');
  const skipInitialFetch = useRef(ssrMatches);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchEventPageClient(id)
      .then(next => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load event.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section>
        <h1>Event</h1>
        <p>Loading event…</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section>
        <h1>Event</h1>
        <p>{error || 'Event not found.'}</p>
      </section>
    );
  }

  return <EventPage {...data} />;
}
