import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getNight, getRead, type Night, type Read } from '@/db';
import { formatDuration, longDateLabel } from '@/format';
import { usePalette } from '@/hooks/use-palette';
import { transcribeNight } from '@/transcribe';
import { radius, size, space, type } from '@/theme';

// One past night from Journal: its read (step 7 fills this in) and what you said. Read-only.
export default function NightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [night, setNight] = useState<Night | null>(null);
  const [read, setRead] = useState<Read | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.all([getNight(db, id), getRead(db, id)]).then(([n, r]) => {
        setNight(n);
        setRead(r);
      }),
    [db, id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const transcribe = async () => {
    setTranscribing(true);
    setError(null);
    const result = await transcribeNight(db, id);
    if (!result.ok) setError(result.message);
    await load();
    setTranscribing(false);
  };

  const muted = { color: palette.textMuted };
  const card = [styles.card, { backgroundColor: palette.surface, borderColor: palette.border }];

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl },
      ]}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to Journal"
        style={styles.back}>
        <Text style={[type.body, { color: palette.accent }]}>‹ Journal</Text>
      </Pressable>

      {night && (
        <>
          <View style={styles.header}>
            <Text style={[type.title, { color: palette.text }]}>{longDateLabel(night.date)}</Text>
            <Text style={[type.status, muted]}>
              {formatDuration(night.durationSec)} · {night.inputType === 'voice' ? 'spoken' : 'typed'}
            </Text>
          </View>

          <View style={card}>
            <Text style={[type.label, { color: palette.accent }]}>Tonight&apos;s read</Text>
            <Text style={[type.body, muted]}>
              {read?.status === 'ready' && read.reflection ? read.reflection : 'No read yet.'}
            </Text>
          </View>

          <View style={card}>
            <Text style={[type.label, { color: palette.accent }]}>What you said</Text>
            {night.transcript ? (
              <Text style={[type.body, { color: palette.text }]}>{night.transcript}</Text>
            ) : (
              <>
                <Text style={[type.body, muted]}>
                  {transcribing ? 'Transcribing…' : 'Not transcribed yet.'}
                </Text>
                {error && <Text style={[type.caption, muted]}>{error}</Text>}
                {night.inputType === 'voice' && !transcribing && (
                  <Pressable onPress={transcribe} accessibilityRole="button" style={styles.button}>
                    <Text style={[type.body, { color: palette.accent }]}>Transcribe now</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, gap: space.lg },
  back: { minHeight: size.touchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  header: { gap: space.xs },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  button: { minHeight: size.touchTarget, justifyContent: 'center' },
});
