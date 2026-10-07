import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';
import { Ionicons } from './icons';

/** iOS form sheet: slides up from the bottom on native, centered card on web. */
export function SheetModal({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  // Percentage max-heights resolve against an auto-height parent (no limit at
  // all on web), so cap the sheet with a real number to keep it inside the
  // viewport and let the body scroll.
  const { height: windowHeight } = useWindowDimensions();
  const maxSheetHeight = Math.round(windowHeight * (isWeb ? 0.85 : 0.88));
  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, isWeb ? styles.backdropCenter : styles.backdropBottom]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoid}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, maxHeight: maxSheetHeight },
              isWeb && styles.sheetWeb,
            ]}
          >
            {!isWeb ? <View style={[styles.grabber, { backgroundColor: colors.fillStrong }]} /> : null}
            <View style={styles.header}>
              <AppText variant="headline" style={{ flex: 1, textAlign: 'center' }}>
                {title}
              </AppText>
              <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
                <Ionicons name="close" size={18} color={colors.systemGray} />
              </Pressable>
            </View>
            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  backdropBottom: { justifyContent: 'flex-end' },
  backdropCenter: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  avoid: { width: '100%', alignItems: 'center' },
  sheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 16,
  },
  sheetWeb: { borderRadius: 16, maxWidth: 460 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 999, marginTop: 6 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  close: { position: 'absolute', right: 12, top: 10, padding: 6 },
  body: { paddingHorizontal: 20, flexShrink: 1, minHeight: 0 },
  footer: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
});
