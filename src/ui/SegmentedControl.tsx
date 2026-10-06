import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Text';

/** iOS segmented control with an animated sliding indicator. */
export function SegmentedControl({
  options,
  selectedIndex,
  onChange,
}: {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (width === 0 || options.length === 0) return;
    Animated.timing(position, {
      toValue: (selectedIndex * width) / options.length,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, width, options.length, position]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.fill }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && options.length > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: width / options.length - 4,
              backgroundColor: colors.surface,
              transform: [{ translateX: position }],
            },
          ]}
        />
      ) : null}
      {options.map((option, index) => (
        <Pressable key={option} style={styles.segment} onPress={() => onChange(index)}>
          <AppText
            style={{
              fontSize: 13,
              fontWeight: index === selectedIndex ? '600' : '400',
              color: index === selectedIndex ? colors.label : colors.secondaryLabel,
            }}
          >
            {option}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 9, padding: 2, height: 32 },
  indicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
});
