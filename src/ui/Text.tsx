import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { typography, useTheme, type TypographyVariant } from '../theme';

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'center' | 'right';
}

/** Text using the iOS SF type ramp. Defaults to `body` (17pt regular). */
export function AppText({
  variant = 'body',
  color,
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      style={[
        typography[variant],
        { color: color ?? colors.label },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
