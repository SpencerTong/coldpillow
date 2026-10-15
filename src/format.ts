// Display helpers for durations and night dates. Night dates are local YYYY-MM-DD strings.

// 128 -> "2:08"
export function formatDuration(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateString(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

// "Friday" within the last week, "Sat, Oct 3" before that (with the year if it isn't this year).
export function dayLabel(date: string, today: string): string {
  const d = parseDate(date);
  if (daysBetween(date, today) < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  const sameYear = d.getFullYear() === parseDate(today).getFullYear();
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

// "Friday, Oct 10"
export function longDateLabel(date: string): string {
  return parseDate(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// Monday..Sunday of the week containing `today`.
export function weekDates(today: string): string[] {
  const d = parseDate(today);
  const fromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - fromMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return toDateString(day);
  });
}
