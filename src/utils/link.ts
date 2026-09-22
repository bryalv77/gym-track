import { Linking, Platform } from 'react-native';

/** Opens an external URL (demo video) — new tab on web, native handler on mobile. */
export function openExternalUrl(url: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  Linking.openURL(url).catch(() => undefined);
}
