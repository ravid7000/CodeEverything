import { useEffect, useState } from 'react';
import { formatDuration } from './format';

/**
 * Hydration-safe countdown anchored to server time.
 * First paint uses generatedAt; after mount ticks with skew-corrected client clock.
 */
export function useCountdown(targetIso: string, serverNowIso: string) {
  const target = new Date(targetIso).getTime();
  const serverNow = new Date(serverNowIso).getTime();
  const initialRemaining = Math.max(0, target - serverNow);

  const [remainingMs, setRemainingMs] = useState(initialRemaining);

  useEffect(() => {
    const t0 = performance.now();

    const tick = () => {
      const effectiveNow = serverNow + (performance.now() - t0);
      setRemainingMs(Math.max(0, target - effectiveNow));
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [target, serverNow]);

  return {
    remainingMs,
    label: formatDuration(remainingMs),
  };
}
