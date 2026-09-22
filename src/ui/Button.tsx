import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { radius, useTheme } from '../theme';
import { Ionicons, type IconName } from './icons';
import { AppText } from './Text';

type ButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';
type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/** iOS-style button: filled blue, tinted, gray, plain text or destructive. */
export function Button({
  label,
  onPress,
  variant = 'filled',
  size = 'lg',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const heights: Record<ButtonSize, number> = { lg: 50, md: 44, sm: 32 };
  const fontSizes: Record<ButtonSize, number> = { lg: 17, md: 15, sm: 13 };

  const textColor =
    variant === 'filled'
      ? '#FFFFFF'
      : variant === 'destructive'
        ? colors.systemRed
        : variant === 'gray'
          ? colors.label
          : colors.systemBlue;

  const backgroundColor =
    variant === 'filled'
      ? colors.systemBlue
      : variant === 'destructive'
        ? colors.redTint
        : variant === 'tinted'
          ? colors.blueTint
          : variant === 'gray'
            ? colors.systemGray5
            : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          backgroundColor,
          borderRadius: size === 'sm' ? radius.md : radius.lg,
          paddingHorizontal: size === 'sm' ? 14 : 20,
        },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={fontSizes[size] + 2} color={textColor} /> : null}
          <AppText
            style={{
              color: textColor,
              fontSize: fontSizes[size],
              fontWeight: '600',
              letterSpacing: -0.32,
            }}
          >
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  dimmed: { opacity: 0.4 },
});
