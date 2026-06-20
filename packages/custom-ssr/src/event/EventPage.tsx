import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDVRService } from './dvrService';
import {
  formatTimeUtc,
  getText,
  slug,
  startingSoonAt,
  statusAt,
} from './format';
import type { EventPageProps } from './types';
import { useCountdown } from './useCountdown';
import { useLocalStorageFlag, useLocalStorageNumber } from './useLocalStorage';

type ActionItem = {
  key: string;
  type: 'team' | 'league' | 'record';
  label: string;
  id?: string;
  href: string;
};

export function EventPage({ event, generatedAt }: EventPageProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const recordId = event.listingId || event.id;

  const [isExpanded, setIsExpanded] = useLocalStorageFlag(`expanded-${event.id}`);
  const [focusedIndex, setFocusedIndex] = useLocalStorageNumber(`focus-${event.id}`);
  const [isRecording, setIsRecording] = useLocalStorageFlag(`dvr-${recordId}`);
  const focusedIndexRef = useRef(focusedIndex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [renderCount, setRenderCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const startDate = useMemo(() => {
    const date = new Date(event.startDate);
    date.setUTCMinutes(date.getUTCMinutes() + 30);
    return date;
  }, [event.startDate]);

  const status = statusAt(event.isLive, startDate, generatedAt);
  const timeDisplay = formatTimeUtc(startDate);
  const countdown = useCountdown(startDate.toISOString(), generatedAt);

  const actions: ActionItem[] = useMemo(
    () => [
      {
        key: 'home',
        type: 'team',
        label: event.homeTeam?.name || 'Home',
        id: event.homeTeam?.id,
        href: `/team/${slug(event.homeTeam?.name)}?id=${event.homeTeam?.id}`,
      },
      {
        key: 'away',
        type: 'team',
        label: event.awayTeam?.name || 'Away',
        id: event.awayTeam?.id,
        href: `/team/${slug(event.awayTeam?.name)}?id=${event.awayTeam?.id}`,
      },
      {
        key: 'league',
        type: 'league',
        label: event.league?.name || 'League',
        id: event.league?.id,
        href: `/league/${slug(event.league?.name)}?id=${event.league?.id}`,
      },
      {
        key: 'record',
        type: 'record',
        label: isRecording ? getText('REMOVE') : getText('RECORD'),
        id: event.listingId,
        href: '',
      },
    ],
    [event, isRecording],
  );

  const clampFocus = useCallback(
    (index: number) => Math.max(0, Math.min(actions.length - 1, index)),
    [actions.length],
  );

  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  useEffect(() => {
    setMounted(true);
    document.title = `${event.homeTeam?.name} vs ${event.awayTeam?.name} | Sports`;
  }, [event.homeTeam?.name, event.awayTeam?.name]);

  useEffect(() => {
    setRenderCount(count => count + 1);
  }, [status]);

  useEffect(() => {
    const dvr = getDVRService();
    if (!dvr) return;

    const cb = (value: boolean) => setIsRecording(value);
    dvr.register(recordId, cb);
    if (dvr.isRecording(recordId)) setIsRecording(true);

    return () => dvr.unregister(recordId, cb);
  }, [recordId]);

  const handleRecord = useCallback(async () => {
    const dvr = getDVRService();
    if (!event.listingId) {
      setError('Unavailable');
      return;
    }
    if (!dvr) return;

    setLoading(true);
    setError('');
    try {
      await dvr.record(event.listingId);
      setIsRecording(dvr.isRecording(event.listingId));
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [event.listingId]);

  const handleAction = useCallback(
    (item: ActionItem) => {
      if (item.type === 'record') {
        void handleRecord();
        return;
      }
      if (!item.id) {
        setError('Missing id');
        return;
      }
      if (startingSoonAt(startDate, generatedAt) && event.listingId) {
        void handleRecord();
        return;
      }
      navigate(item.href);
    },
    [event.listingId, generatedAt, handleRecord, navigate, startDate],
  );

  useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setFocusedIndex(index => clampFocus(index + 1));
      }
      if (e.key === 'ArrowUp') {
        setFocusedIndex(index => clampFocus(index - 1));
      }
      if (e.key === 'Enter') {
        const item = actions[focusedIndexRef.current];
        if (item) handleAction(item);
      }
      if (e.key === 'Escape') navigate('/sports');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions, clampFocus, handleAction, mounted, navigate]);

  const title = `${event.homeTeam?.name} vs ${event.awayTeam?.name}`;

  return (
    <article
      ref={modalRef}
      style={{ padding: 20, width: 520, background: '#1a1a1a', color: '#fff' }}
      aria-label={title}
    >
      <h1>{title}</h1>
      <p>Status: {status}</p>
      <time dateTime={startDate.toISOString()}>Time: {timeDisplay} UTC</time>
      <p>Countdown: {countdown.label}</p>
      <p>Rendering Hint: {event.renderHint}</p>
      <p>Generated At: {generatedAt}</p>

      {mounted && (
        <p suppressHydrationWarning>
          Server-synced clock: {new Date(Date.now()).toLocaleTimeString('en-US')}
        </p>
      )}

      <p aria-live="polite">Render Count: {renderCount}</p>

      <button
        type="button"
        onClick={() => setIsExpanded(value => !value)}
        style={{ marginRight: 8 }}
      >
        Toggle Details
      </button>
      <button type="button" onClick={() => navigate('/sports')}>
        Close
      </button>

      {isExpanded && (
        <div style={{ margin: '12px 0' }}>
          <p>League: {event.league?.name}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      )}

      <div role="listbox" aria-label="Event actions">
        {actions.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={focusedIndex === index}
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
            {item.label}{' '}
            {item.type === 'record'
              ? loading
                ? '...'
                : isRecording
                  ? '✓'
                  : '+'
              : '>'}
          </button>
        ))}
      </div>
    </article>
  );
}
