import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import { Ionicons } from './icons';

/** iOS-style capsule search box with a magnifier and a clear button. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[styles.container, { backgroundColor: colors.fill }]}
      accessibilityRole="search"
    >
      <Ionicons name="search" size={16} color={colors.secondaryLabel} />
      <TextInput
        style={[styles.input, { color: colors.label }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('common.search')}
        placeholderTextColor={colors.tertiaryLabel}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel={t('common.clearSearch')}>
          <Ionicons name="close-circle" size={16} color={colors.tertiaryLabel} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    borderRadius: radius.md,
    paddingHorizontal: 10,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
});
