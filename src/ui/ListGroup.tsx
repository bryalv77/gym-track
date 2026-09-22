import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';
import { Ionicons, type IconName } from './icons';

/** iOS inset-grouped list container (like the Settings app). */
export function ListGroup({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <View style={[styles.group, { backgroundColor: colors.surface }]}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <View style={[styles.separator, { backgroundColor: colors.separator }]} /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

/** Small gray caption shown above a group. */
export function ListGroupHeader({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <AppText variant="footnote" color={colors.secondaryLabel} style={styles.header}>
      {label}
    </AppText>
  );
}

/** Small gray caption shown below a group. */
export function ListGroupFooter({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <AppText variant="footnote" color={colors.secondaryLabel} style={styles.footer}>
      {label}
    </AppText>
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: { name: IconName; color?: string; background?: string };
  leading?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  control?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  dimmed?: boolean;
  titleStrike?: boolean;
}

/** A single grouped-list row: optional icon/avatar on the left, title +
 *  subtitle in the middle, value/control/chevron on the right. */
export function ListRow({
  title,
  subtitle,
  value,
  icon,
  leading,
  chevron = false,
  destructive = false,
  control,
  onPress,
  disabled = false,
  dimmed = false,
  titleStrike = false,
}: ListRowProps) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, dimmed && styles.dimmed]}>
      {icon ? (
        <View
          style={[
            styles.iconBox,
            { backgroundColor: icon.background ?? colors.blueTint },
          ]}
        >
          <Ionicons name={icon.name} size={17} color={icon.color ?? colors.systemBlue} />
        </View>
      ) : null}
      {leading}
      <View style={styles.texts}>
        <AppText
          variant="headline"
          numberOfLines={1}
          style={{
            color: destructive ? colors.systemRed : colors.label,
            textDecorationLine: titleStrike ? 'line-through' : 'none',
            textDecorationColor: colors.secondaryLabel,
          }}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="footnote" color={colors.secondaryLabel}>
          {value}
        </AppText>
      ) : null}
      {control}
      {chevron ? <Ionicons name="chevron-forward" size={15} color={colors.tertiaryLabel} /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => (pressed ? { backgroundColor: colors.fill } : null)}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 10, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  header: { marginLeft: 32, marginBottom: 7, marginTop: 8 },
  footer: { marginHorizontal: 32, marginTop: 7 },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  iconBox: { width: 29, height: 29, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  dimmed: { opacity: 0.55 },
});
