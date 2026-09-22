import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';

export interface BarChartItem {
  label: string;
  value: number;
  highlight?: boolean;
}

/** Lightweight bar chart built from plain Views — works on iOS, Android and
 *  web. `baseline="min"` makes narrow ranges (body weight) readable. */
export function BarChart({
  data,
  height = 130,
  barColor,
  highlightColor,
  baseline = 'zero',
}: {
  data: BarChartItem[];
  height?: number;
  barColor?: string;
  highlightColor?: string;
  baseline?: 'zero' | 'min';
}) {
  const { colors } = useTheme();
  const bar = barColor ?? colors.systemBlue;
  const highlight = highlightColor ?? colors.systemGreen;
  const values = data.map((item) => item.value);
  const max = Math.max(1, ...values);
  const min = baseline === 'min' ? Math.min(...values, Infinity) * 0.95 : 0;
  const span = Math.max(max - min, 1);

  return (
    <View style={[styles.chart, { height }]}>
      {data.map((item, index) => {
        const ratio = item.value === 0 ? 0 : (item.value - min) / span;
        const barHeight = item.value === 0 ? 4 : Math.max(8, Math.round(ratio * (height - 26)));
        return (
          <View key={`${item.label}-${index}`} style={styles.column}>
            <AppText
              variant="caption2"
              color={item.value > 0 ? colors.secondaryLabel : colors.tertiaryLabel}
            >
              {item.value > 0 ? String(item.value) : ''}
            </AppText>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor:
                    item.value === 0 ? colors.fill : item.highlight ? highlight : bar,
                },
              ]}
            />
            <AppText
              variant="caption2"
              color={item.highlight ? colors.label : colors.secondaryLabel}
            >
              {item.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' },
  bar: { width: '70%', maxWidth: 30, borderRadius: 4 },
});
