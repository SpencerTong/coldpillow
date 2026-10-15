import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JournalCard } from '@/components/journal-card';
import { WeekDots } from '@/components/week-dots';
import { listJournal, nightDateFor, type JournalEntry } from '@/db';
import { weekDates } from '@/format';
import { usePalette } from '@/hooks/use-palette';
import { space, type } from '@/theme';

export default function JournalScreen() {
  const db = useSQLiteContext();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [today, setToday] = useState(() => nightDateFor());

  // Reload every time the tab is opened so a night just recorded shows up.
  useFocusEffect(
    useCallback(() => {
      setToday(nightDateFor());
      listJournal(db).then(setEntries);
    }, [db]),
  );

  const nightDates = new Set((entries ?? []).map((e) => e.date));
  const thisWeek = weekDates(today).filter((d) => nightDates.has(d)).length;
  const total = entries?.length ?? 0;

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={[type.title, { color: palette.text }]}>Journal</Text>
        <Text style={[type.status, { color: palette.textMuted }]}>
          {total} {total === 1 ? 'night' : 'nights'}
        </Text>
      </View>
      <WeekDots today={today} nightDates={nightDates} />
      <Text style={[type.caption, { color: palette.textMuted }]}>
        {thisWeek} {thisWeek === 1 ? 'night' : 'nights'} this week · {total} in total
      </Text>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xxl, paddingBottom: space.xxl },
      ]}
      data={entries ?? []}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => <JournalCard entry={item} today={today} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        entries ? (
          <Text style={[type.body, { color: palette.textMuted }]}>
            No nights yet. Your first one will show up here.
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, gap: space.md },
  header: { gap: space.md, marginBottom: space.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
});
