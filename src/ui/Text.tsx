import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { tabularNums, typography, useTheme, type TypographyVariant } from '../theme';

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'center' | 'right';
  tabular?: boolean;
}

/** Text using the iOS SF type ramp. Defaults to `body` (17pt regular). */
export function AppText({
  variant = 'body',
  color,
  align,
  tabular = false,
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
        tabular ? tabularNums : null,
        style,
      ]}
      {...rest}
    />
  );
}
