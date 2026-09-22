import React, { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { radius, useTheme } from '../theme';
import { AppText } from './Text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

/** iOS-style form field: small-caps label, rounded input, blue focus ring. */
export function TextField({ label, error, style, multiline, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      {label ? (
        <AppText style={[styles.label, { color: colors.secondaryLabel }]}>{label}</AppText>
      ) : null}
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={colors.tertiaryLabel}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        style={[
          styles.input,
          { backgroundColor: colors.surface, borderColor: colors.separator, color: colors.label },
          multiline && styles.multiline,
          focused && { borderColor: colors.systemBlue },
          error != null && { borderColor: colors.systemRed },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption1" color={colors.systemRed}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 17,
  },
  multiline: {
    height: 'auto',
    minHeight: 100,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
});
