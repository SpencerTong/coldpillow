import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { JournalEntry } from '@/db';
import { dayLabel, formatDuration } from '@/format';
import { usePalette } from '@/hooks/use-palette';
import { radius, space, type } from '@/theme';

// One night in the Journal list (mockup 10). The free-form label after the length
// arrives with reads in step 6; until then only the length shows.
export function JournalCard({ entry, today }: { entry: JournalEntry; today: string }) {
  const palette = usePalette();
  const preview =
    entry.readStatus === 'ready' && entry.summary
      ? entry.summary
      : (entry.transcript ?? (entry.inputType === 'voice' ? 'Not transcribed yet' : ''));
  const day = dayLabel(entry.date, today);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/night/[id]', params: { id: entry.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${day}, ${formatDuration(entry.durationSec)}. ${preview}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.top}>
        <Text style={[type.label, { color: palette.text }]}>{day}</Text>
        <Text style={[type.caption, { color: palette.textMuted }]}>
          {formatDuration(entry.durationSec)}
        </Text>
      </View>
      {preview ? (
        <Text
          style={[type.body, { color: entry.transcript || entry.summary ? palette.text : palette.textMuted }]}
          numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    gap: space.xs,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  pressed: { opacity: 0.8 },
});
