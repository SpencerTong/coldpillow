import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { paletteFor, type Palette } from '@/theme';

// Milliseconds until the next palette boundary (05:00 or 17:00).
function msUntilNextSwitch(now: Date): number {
  const next = new Date(now);
  next.setSeconds(0, 0);
  const hour = now.getHours();
  if (hour < 5) {
    next.setHours(5, 0);
  } else if (hour < 17) {
    next.setHours(17, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(5, 0);
  }
  return next.getTime() - now.getTime();
}

// Current palette by time of day. Re-checks on return to foreground
// and at the next 05:00 / 17:00 boundary while the app is open.
export function usePalette(): Palette {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setTimeout(() => setNow(new Date()), msUntilNextSwitch(now) + 1000);
    return () => clearTimeout(timer);
  }, [now]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => sub.remove();
  }, []);

  return paletteFor(now);
}
