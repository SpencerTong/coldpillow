import { StyleSheet, Text, View } from 'react-native';

import { weekDates } from '@/format';
import { usePalette } from '@/hooks/use-palette';
import { radius, size, space, type } from '@/theme';

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Seven dots for Monday..Sunday: filled for nights you talked, a ring on today if not yet,
// and a quiet outline otherwise. No streak and no judgement for missed days.
export function WeekDots({ today, nightDates }: { today: string; nightDates: Set<string> }) {
  const palette = usePalette();
  const days = weekDates(today);
  const count = days.filter((d) => nightDates.has(d)).length;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${count} of 7 nights this week`}>
      {days.map((date, i) => {
        const done = nightDates.has(date);
        const isToday = date === today;
        return (
          <View key={date} style={styles.day}>
            <View
              style={[
                styles.dot,
                done
                  ? { backgroundColor: palette.accent }
                  : {
                      borderWidth: size.dotBorder,
                      borderColor: isToday ? palette.accent : palette.dotEmpty,
                    },
              ]}
            />
            <Text style={[type.caption, { color: palette.textMuted }]}>{DAY_INITIALS[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  day: { alignItems: 'center', gap: space.xs },
  dot: { width: size.weekDot, height: size.weekDot, borderRadius: radius.pill },
});
