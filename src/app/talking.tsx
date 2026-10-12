import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecorderState,
} from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discardRecording, keepRecording } from '@/audio';
import { insertNight } from '@/db';
import { dim, radius, size, space, type } from '@/theme';

const MAX_SECONDS = 5 * 60;
const MIN_VOICE_SECONDS = 2;
const POLL_MS = 100;
const BAR_COUNT = 13;
const BAR_MAX = 0.8; // tallest bar as a share of the waveform height
const PROMPT = "Your day, what's on your mind, what's next. No need to make sense.";

function formatTime(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// dBFS (about -60 quiet to 0 loud) to 0..1.
function levelFromMetering(db: number | undefined): number {
  if (db === undefined) return 0;
  return Math.min(1, Math.max(0, (db + 60) / 60));
}

export default function TalkingScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  useKeepAwake();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + space.xxl * 2, paddingBottom: insets.bottom + space.xxl },
      ]}>
      <StatusBar style="light" />
      {mode === 'text' ? <TypeFlow /> : <VoiceFlow />}
    </View>
  );
}

function VoiceFlow() {
  const db = useSQLiteContext();
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const [state, setState] = useState<RecorderState>(() => recorder.getStatus());
  const [denied, setDenied] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));
  const startedAt = useRef<Date | null>(null);
  const finishing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (cancelled) return;
      if (!granted) {
        setDenied(true);
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (cancelled) return;
      startedAt.current = new Date();
      recorder.record();
    })();
    return () => {
      cancelled = true;
    };
  }, [recorder]);

  const finish = useCallback(async () => {
    if (finishing.current || !startedAt.current) return;
    finishing.current = true;
    try {
      const durationSec = Math.min(MAX_SECONDS, Math.round(recorder.currentTime));
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;

      if (!uri || durationSec < MIN_VOICE_SECONDS) {
        discardRecording(uri);
        router.back();
        return;
      }

      // Local-first: the night row exists before anything else happens to it.
      const night = await insertNight(db, {
        inputType: 'voice',
        durationSec,
        startedAt: startedAt.current,
      });
      await keepRecording(uri, night.id);
      router.replace({ pathname: '/read', params: { nightId: night.id } });
    } catch (e) {
      console.error('[talking] saving the recording failed', e);
      finishing.current = false;
    }
  }, [db, recorder]);

  // Poll the recorder for the timer and the waveform's latest level.
  useEffect(() => {
    const timer = setInterval(() => {
      const status = recorder.getStatus();
      setState(status);
      if (status.isRecording) {
        setLevels((prev) => [...prev.slice(1), levelFromMetering(status.metering)]);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [recorder]);

  // Stop at 5 minutes.
  useEffect(() => {
    if (state.durationMillis >= MAX_SECONDS * 1000) finish();
  }, [state.durationMillis, finish]);

  // iOS cuts recording off in the background, so save what there is.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') finish();
    });
    return () => sub.remove();
  }, [finish]);

  if (denied) {
    return (
      <View style={styles.center}>
        <Text style={[type.body, styles.text, styles.centerText]}>
          Microphone access is off. You can turn it on in Settings, or type tonight instead.
        </Text>
        <Pressable
          onPress={() => router.replace({ pathname: '/talking', params: { mode: 'text' } })}
          accessibilityRole="button"
          style={styles.link}>
          <Text style={[type.body, styles.accentText]}>Type instead</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Text style={[type.status, styles.muted]}>Listening · the screen stays dim</Text>
      <Text style={[type.timer, styles.timer]}>{formatTime(state.durationMillis / 1000)}</Text>

      <View style={styles.waveform} accessibilityElementsHidden importantForAccessibility="no">
        {levels.map((level, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: Math.max(space.sm, level * size.waveform * BAR_MAX),
                opacity: 0.5 + level * 0.5,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[type.quote, styles.prompt]}>{PROMPT}</Text>

      <StopButton
        onPress={finish}
        caption="Tap to stop · saved on your phone"
        label="Stop and save"
      />
    </>
  );
}

function TypeFlow() {
  const db = useSQLiteContext();
  const [text, setText] = useState('');
  const startedAt = useRef(new Date());
  const finishing = useRef(false);

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    const transcript = text.trim();
    if (!transcript) {
      router.back();
      return;
    }
    const durationSec = Math.round((Date.now() - startedAt.current.getTime()) / 1000);
    const night = await insertNight(db, {
      inputType: 'text',
      transcript,
      durationSec,
      startedAt: startedAt.current,
    });
    router.replace({ pathname: '/read', params: { nightId: night.id } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.typeFlow}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={[type.status, styles.muted]}>Typing · just for you</Text>
      <TextInput
        style={[type.body, styles.text, styles.input]}
        value={text}
        onChangeText={setText}
        placeholder={PROMPT}
        placeholderTextColor={dim.textMuted}
        selectionColor={dim.accent}
        multiline
        autoFocus
        textAlignVertical="top"
        accessibilityLabel="Tonight's pillow talk"
      />
      <StopButton onPress={finish} caption="Tap when you're done · saved on your phone" label="Save" />
    </KeyboardAvoidingView>
  );
}

function StopButton({
  onPress,
  caption,
  label,
}: {
  onPress: () => void;
  caption: string;
  label: string;
}) {
  return (
    <View style={styles.stopArea}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}>
        <View style={styles.stopSquare} />
      </Pressable>
      <Text style={[type.status, styles.muted]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: dim.background,
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  text: { color: dim.text },
  muted: { color: dim.textMuted },
  accentText: { color: dim.accent },
  timer: { color: dim.textBright, marginTop: space.lg + space.xs },
  waveform: {
    height: size.waveform,
    marginTop: space.xxl + space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  bar: {
    width: size.waveBar,
    borderRadius: size.waveBar / 2,
    backgroundColor: dim.accent,
  },
  prompt: {
    color: dim.quote,
    textAlign: 'center',
    marginTop: space.xxl + space.lg,
    maxWidth: size.promptWidth,
  },
  stopArea: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: space.md,
  },
  stopButton: {
    width: size.stopButton,
    height: size.stopButton,
    borderRadius: radius.pill,
    borderWidth: size.stopBorder,
    borderColor: dim.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: size.stopSquare,
    height: size.stopSquare,
    borderRadius: radius.stopSquare,
    backgroundColor: dim.accent,
  },
  pressed: { opacity: 0.7 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.lg },
  centerText: { textAlign: 'center' },
  link: { minHeight: size.touchTarget, justifyContent: 'center' },
  typeFlow: { flex: 1, alignSelf: 'stretch', alignItems: 'center' },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    marginVertical: space.xl,
  },
});
