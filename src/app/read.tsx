import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { getNight, type Night } from '@/db';
import { usePalette } from '@/hooks/use-palette';
import { transcribeNight } from '@/transcribe';
import { size, space, type } from '@/theme';

type Status =
  | { kind: 'idle' }
  | { kind: 'transcribing' }
  | { kind: 'done'; ms: number }
  | { kind: 'failed'; message: string };

// Placeholder until step 7. For the step 4 spike it transcribes a voice night on arrival
// and shows the text and how long it took; Goodnight returns to Tonight.
export default function ReadScreen() {
  const { nightId } = useLocalSearchParams<{ nightId?: string }>();
  const db = useSQLiteContext();
  const palette = usePalette();
  const [night, setNight] = useState<Night | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const started = useRef(false);

  const transcribe = useCallback(async () => {
    if (!nightId) return;
    setStatus({ kind: 'transcribing' });
    const result = await transcribeNight(db, nightId);
    setStatus(result.ok ? { kind: 'done', ms: result.ms } : { kind: 'failed', message: result.message });
    setNight(await getNight(db, nightId));
  }, [db, nightId]);

  useEffect(() => {
    if (!nightId) return;
    getNight(db, nightId).then((n) => {
      setNight(n);
      if (n?.inputType === 'voice' && n.transcript === null && !started.current) {
        started.current = true;
        transcribe();
      }
    });
  }, [db, nightId, transcribe]);

  const muted = { color: palette.textMuted };

  return (
    <PlaceholderScreen title="Tonight's read">
      <ScrollView contentContainerStyle={styles.body}>
        {night && (
          <Text style={[type.caption, muted]}>
            Night saved · {night.date} · {night.inputType} · {night.durationSec}s
          </Text>
        )}
        {status.kind === 'transcribing' && <Text style={[type.body, muted]}>Transcribing…</Text>}
        {status.kind === 'done' && (
          <Text style={[type.caption, muted]}>
            Transcribed on-device in {(status.ms / 1000).toFixed(1)}s
          </Text>
        )}
        {status.kind === 'failed' && (
          <>
            <Text style={[type.body, muted]}>{status.message}</Text>
            <Pressable onPress={transcribe} accessibilityRole="button" style={styles.button}>
              <Text style={[type.body, { color: palette.accent }]}>Try again</Text>
            </Pressable>
          </>
        )}
        {night?.transcript ? (
          <Text style={[type.body, { color: palette.text }]}>{night.transcript}</Text>
        ) : null}
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          style={styles.button}>
          <Text style={[type.body, { color: palette.accent }]}>Goodnight</Text>
        </Pressable>
      </ScrollView>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.xxl },
  button: { minHeight: size.touchTarget, justifyContent: 'center' },
});
