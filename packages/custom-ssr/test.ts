/*
 * IMPORTANT:
 * This page must work correctly when rendered:
 * 1. On the server (SSR)
 * 2. On the client (CSR / navigation)
 *
 * Avoid crashes, hydration issues, and inconsistent UI.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

type Callback = (v: boolean) => void;
type Team = { id?: string; name: string; logo?: string };
type EventData = {
  id: string;
  listingId?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  league?: Team;
  startDate: string;
  isLive: boolean;
  renderHint?: 'SSR' | 'SSG' | 'ISR';
};

class DVRService {
  private static instance: DVRService | null = null;
  private callbacks = new Map < string, Set<Callback>> ();
  private recordings: Record < string, boolean > = { };

  static getInstance() {
  if (!this.instance) this.instance = new DVRService();
  return this.instance;
}

isRecording(id: string) {
  return !!this.recordings[id];
}

register(id: string, cb: Callback) {
  if (!this.callbacks.has(id)) this.callbacks.set(id, new Set());
  this.callbacks.get(id)!.add(cb);
}

unregister(id: string, cb: Callback) {
  this.callbacks.get(id)?.delete(cb);
}

  async record(id: string) {
  return new Promise < void> ((resolve, reject) =>
    setTimeout(() => {
      if (Math.random() > 0.85) return reject(new Error('record failed'));
      this.recordings[id] = true;
      this.callbacks.get(id)?.forEach(cb => cb(true));
      resolve();
    }, 500)
  );
}
}

const router = { push: (path: string) => console.log('Navigate:', path) };
const getText = (k: string) => ({ RECORD: 'Record', REMOVE: 'Remove', LIVE: 'Live Now' }[k] || k);

const slug = (v?: string) => (v || '').toLowerCase().replace(/\s+/g, '-');
const statusText = (isLive: boolean, d: Date) => (isLive ? getText('LIVE') : d.getTime() < Date.now() ? 'Started' : 'Upcoming');
const formatTime = (d: Date, locale: string) => d.toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const startingSoon = (d: Date) => d.getTime() - Date.now() < 3600000;

async function fetchEvent(id: string): Promise<EventData> {
  return {
    id,
    listingId: `listing-${id}`,
    homeTeam: { id: 'h1', name: 'Lions' },
    awayTeam: { id: 'a1', name: 'Bears' },
    league: { id: 'l1', name: 'Premier League' },
    startDate: new Date(Date.now() + 7200000).toISOString(),
    isLive: false,
    renderHint: 'SSR',
  };
}

// Intentionally SSR only
export const getServerSideProps: GetServerSideProps<{ event: EventData; generatedAt: string }> = async ctx => {
  const id = String(ctx.query.id || 'evt-1');
  return { props: { event: await fetchEvent(id), generatedAt: new Date().toISOString() } };
};

function EventPage({
  event,
  generatedAt,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const dvr = DVRService.getInstance();
  const modalRef = useRef < HTMLDivElement | null > (null);

  // SSR / hydration
  const savedExpanded = localStorage.getItem(`expanded-${event.id}`);
  const savedFocus = Number(localStorage.getItem(`focus-${event.id}`) || 0);
  const savedRecording = localStorage.getItem(`dvr-${event.listingId || event.id}`) === '1';

  const [isExpanded, setIsExpanded] = useState(savedExpanded === '1');
  const [focusedIndex, setFocusedIndex] = useState(savedFocus);
  const [isRecording, setIsRecording] = useState(dvr.isRecording(event.listingId || event.id) || savedRecording);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [renderCount, setRenderCount] = useState(0);
  const [now, setNow] = useState(Date.now());

  const startDate = new Date(event.startDate);
  startDate.setMinutes(startDate.getMinutes() + 30); // mutation smell 

  const status = statusText(event.isLive, startDate);
  const time = formatTime(startDate, 'en-US');

  const actions = [
    { key: 'home', type: 'team', label: event.homeTeam?.name || 'Home', id: event.homeTeam?.id, href: `/team/${slug(event.homeTeam?.name)}?id=${event.homeTeam?.id}` },
    { key: 'away', type: 'team', label: event.awayTeam?.name || 'Away', id: event.awayTeam?.id, href: `/team/${slug(event.awayTeam?.name)}?id=${event.awayTeam?.id}` },
    { key: 'league', type: 'league', label: event.league?.name || 'League', id: event.league?.id, href: `/team/${slug(event.league?.name)}?id=${event.league?.id}` }, // wrong route
    { key: 'record', type: 'record', label: isRecording ? getText('REMOVE') : getText('RECORD'), id: event.listingId, href: '' },
  ];

  const current = actions[focusedIndex];

  useEffect(() => {
    setRenderCount(renderCount + 1);
  }, [renderCount, status]);

  useEffect(() => {
    localStorage.setItem(`expanded-${event.id}`, isExpanded ? '1' : '0');
    localStorage.setItem(`focus-${event.id}`, String(focusedIndex));
    localStorage.setItem(`dvr-${event.listingId || event.id}`, isRecording ? '1' : '0');
  }, [event, isExpanded, focusedIndex, isRecording]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);


  useEffect(() => {
    const recordId = event.listingId || event.id;
    const cb = (value: boolean) => {
      if (value !== isRecording) setIsRecording(value);
    };
    dvr.register(recordId, cb);
  }, [event.id, event.listingId, isRecording]);


  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') setFocusedIndex(focusedIndex + 1);
      if (e.key === 'ArrowUp') setFocusedIndex(focusedIndex - 1);
      if (e.key === 'Enter' && current) handleAction(current);
      if (e.key === 'Escape') router.push('/sports');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusedIndex, current]);

  const handleRecord = async () => {
    if (!event.listingId) return setError('Unavailable');
    setLoading(true);
    setError('');
    dvr
      .record(event.listingId)
      .then(() => {
        setIsRecording(dvr.isRecording(event.listingId!));
        localStorage.setItem(`dvr-${event.listingId}`, '1');
      })
      .catch(() => setError('Something went wrong'));

  };

  const handleAction = (item: typeof actions[number]) => {
    if (item.type === 'record') return handleRecord();
    if (!item.id) setError('Missing id');
    if (startingSoon(startDate) && event.listingId) return handleRecord();
    router.push(item.href);
  };

  return (
    <div ref={modalRef} style={{ padding: 20, width: 520, background: '#1a1a1a', color: '#fff' }}>
      <h1>{event.homeTeam?.name} vs {event.awayTeam?.name}</h1>
      <p>Status: {status}</p>
      <p>Time: {time}</p>
      <p>Recording: {isRecording ? 'Yes' : 'No'}</p>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>Focused: {current?.label}</p>
      <p>Render Count: {renderCount}</p>
      <p>Rendering Hint: {event.renderHint}</p>
      <p>Generated At: {generatedAt}</p>
      <p>Now: {new Date(now).toLocaleTimeString('en-US')}</p>

      <button onClick={() => setIsExpanded(!isExpanded)} style={{ marginRight: 8 }}>Toggle Details</button>
      <button onClick={() => router.push('/sports')}>Close</button>

      {isExpanded && (
        <div style={{ margin: '12px 0' }}>
          <p>League: {event.league?.name}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      )}

      {actions.map((item, index) => (
        <button
          key={index}
          onFocus={() => setFocusedIndex(index)}
          onClick={() => handleAction(item)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 8,
            padding: 10,
            background: focusedIndex === index ? '#2f6fed' : '#2b2b2b',
            color: '#fff',
            border: 'none',
          }}
        >
          {item.label} {item.type === 'record' ? (loading ? '...' : isRecording ? '✓' : '+') : '>'}
        </button>
      ))}
    </div>
  );
}

export default EventPage;