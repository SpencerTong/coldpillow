import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette } from '@/hooks/use-palette';
import { space, type } from '@/theme';

// Empty screen with the palette background and a title. Replaced as each build step lands.
export function PlaceholderScreen({ title }: { title: string }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.background, paddingTop: insets.top + space.xl },
      ]}>
      <Text style={[type.title, { color: palette.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: space.xl,
  },
});
