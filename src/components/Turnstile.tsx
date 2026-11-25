import React from 'react';
import { DomWebView } from '@expo/dom-webview';
import { View } from 'react-native';
import { TURNSTILE_URL, type TurnstileProps } from '../config/turnstile';
import { useTheme } from '../theme';

// shortcut: DomWebView has no DOM storage on Android, which Turnstile asks for; move to
// react-native-webview (needs a new binary) before releasing Android.
/** Cloudflare "are you human" check. Remount (change `key`) to get a fresh single-use token. */
export function Turnstile({ onToken }: TurnstileProps) {
  const { mode } = useTheme();
  return (
    <View style={{ height: 65 }}>
      <DomWebView
        source={{ uri: `${TURNSTILE_URL}?theme=${mode}` }}
        scrollEnabled={false}
        style={{ backgroundColor: 'transparent' }}
        onMessage={(event) => onToken(event.nativeEvent.data)}
      />
    </View>
  );
}
