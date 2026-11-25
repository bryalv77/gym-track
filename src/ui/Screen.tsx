import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

/** Screen container: safe-area aware, themed grouped background, scrollable
 *  content by default. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshControl,
  contentContainerStyle,
  maxWidth = 720,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Caps content width so buttons and fields don't stretch on wide screens. */
  maxWidth?: number;
}) {
  const { colors } = useTheme();
  const content = <View style={[styles.content, { maxWidth }, !scroll && styles.flex]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[padded && styles.padded, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.flex, padded && styles.padded]}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { width: '100%', alignSelf: 'center' },
  padded: { padding: 16, paddingBottom: 40 },
});
