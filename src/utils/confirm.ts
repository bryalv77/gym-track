import { Alert, Platform } from 'react-native';
import i18n from '../i18n';

/** Cross-platform confirmation dialog (native Alert on iOS/Android, window.confirm on web). */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = i18n.t('common.delete'),
): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
