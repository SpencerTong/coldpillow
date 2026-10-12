import { StyleSheet, View } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { TalkButton } from '@/components/talk-button';

// Step 8 builds the rest of Tonight (prompt, nights this week, daytime card) around the talk button.
export default function TonightScreen() {
  return (
    <PlaceholderScreen title="Tonight">
      <View style={styles.center}>
        <TalkButton />
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
