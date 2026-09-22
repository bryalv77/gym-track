import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';
import { AppText } from './Text';

function palette(colors: ThemeColors): string[] {
  return [
    colors.systemBlue,
    colors.systemGreen,
    colors.systemOrange,
    colors.systemPurple,
    colors.systemTeal,
    colors.systemIndigo,
    colors.systemPink,
  ];
}

/** Circular avatar: the user's profile photo when available, otherwise their
 *  initials over a deterministic iOS color. */
export function Avatar({
  name,
  size = 40,
  photoUrl,
}: {
  name: string;
  size?: number;
  photoUrl?: string;
}) {
  const { colors } = useTheme();
  const fontSize = Math.round(size * 0.38);
  if (photoUrl) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <Image source={{ uri: photoUrl }} style={{ width: size, height: size }} />
      </View>
    );
  }
  const colors2 = palette(colors);
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  const background = colors2[hash % colors2.length];
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}
    >
      <AppText style={{ color: '#FFFFFF', fontSize, fontWeight: '600' }}>{initials}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
