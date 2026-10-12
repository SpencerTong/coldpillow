import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { usePalette } from '@/hooks/use-palette';
import { radius, size, space, type } from '@/theme';

// Mic geometry copied from docs/mockups/02-FlowTonight.html.
const MIC_SIZE = 44;
const MIC_STROKE = 1.8;

// The big talk button from mockup 02, with "or type instead" below it.
export function TalkButton() {
  const palette = usePalette();

  return (
    <View style={styles.area}>
      <Pressable
        onPress={() => router.push('/talking')}
        accessibilityRole="button"
        accessibilityLabel="Start talking"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.accent },
          pressed && styles.pressed,
        ]}>
        <Svg
          width={MIC_SIZE}
          height={MIC_SIZE}
          viewBox="0 0 24 24"
          fill="none"
          stroke={palette.onAccent}
          strokeWidth={MIC_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round">
          <Rect x="9" y="3" width="6" height="11" rx="3" />
          <Path d="M5 11a7 7 0 0 0 14 0" />
          <Path d="M12 18v3" />
        </Svg>
      </Pressable>
      <Text style={[type.body, { color: palette.text }]}>Tap to talk</Text>
      <Pressable
        onPress={() => router.push({ pathname: '/talking', params: { mode: 'text' } })}
        accessibilityRole="button"
        style={styles.link}>
        <Text style={[type.status, styles.underline, { color: palette.textMuted }]}>
          or type instead
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { alignItems: 'center', gap: space.md },
  button: {
    width: size.recordButton,
    height: size.recordButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  link: { minHeight: size.touchTarget, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
