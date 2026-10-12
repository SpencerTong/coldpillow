import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { usePalette } from '@/hooks/use-palette';
import { fonts, size, space, type } from '@/theme';

// Icon geometry copied from docs/mockups/10-Journal.html.
const ICON_SIZE = 22;
const ICON_STROKE = 1.8;

function TabIcon({ route, color }: { route: string; color: string }) {
  return (
    <Svg
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round">
      {route === 'index' && <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />}
      {route === 'journal' && (
        <>
          <Path d="M4 5h11a5 5 0 0 1 5 5v9H9a5 5 0 0 1-5-5Z" />
          <Path d="M8 10h8M8 14h5" />
        </>
      )}
      {route === 'insights' && <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />}
    </Svg>
  );
}

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: palette.nav,
          borderTopColor: palette.border,
          paddingBottom: insets.bottom,
        },
      ]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const color = focused ? palette.accent : palette.textMuted;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.item}>
            <TabIcon route={route.name} color={color} />
            <Text
              style={[type.tab, { color, fontFamily: focused ? fonts.sansBold : fonts.sans }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    minHeight: size.touchTarget,
  },
});
