import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

/** Past this many chips a picker scrolls horizontally (and gets a search field) instead of wrapping. */
export const MANY_CHIPS = 6;

/** Chips in one scrolling row when `scroll`, otherwise wrapped; `empty` shows only in the wrapped layout. */
export function ChipRow({
  scroll,
  empty,
  children,
}: {
  scroll: boolean;
  empty?: React.ReactNode;
  children: React.ReactNode;
}) {
  return scroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.wrap}>
      {children}
      {empty}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scroll: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
});
