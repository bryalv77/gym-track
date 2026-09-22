import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import {
  AppText,
  BarChart,
  Button,
  Card,
  EmptyState,
  Ionicons,
  ListGroup,
  ListGroupHeader,
  ListRow,
  NavBar,
  Screen,
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectMeasurementsSorted } from '../../store/slices/measurementsSlice';
import { deleteMeasurement } from '../../services/measurements';
import { MeasurementFormModal } from '../../components/MeasurementFormModal';
import { confirmAction } from '../../utils/confirm';
import { formatShortDate, formatMonthDay, parseDateKey } from '../../utils/date';
import type { Measurement } from '../../types';

/** Weight & body measurements: latest snapshot, weight trend and history. */
export function ProgressScreen() {
  const { colors } = useTheme();
  const profile = useAppSelector((state) => state.auth.profile);
  const measurements = useAppSelector(selectMeasurementsSorted);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (entry: Measurement) => {
    setEditing(entry);
    setFormVisible(true);
  };

  const latest = measurements[0];

  const weightEntries = useMemo(
    () =>
      measurements
        .filter((entry) => entry.weightKg != null)
        .slice(0, 8)
        .reverse()
        .map((entry) => ({
          label: formatMonthDay(parseDateKey(entry.dateKey)),
          value: entry.weightKg as number,
          highlight: entry.id === latest?.id,
        })),
    [measurements, latest],
  );

  if (!profile) return null;

  const handleDelete = (entry: Measurement) => {
    confirmAction(
      'Delete Entry',
      'This measurement entry will be permanently removed.',
      async () => {
        try {
          await deleteMeasurement(profile.uid, entry.id);
        } catch (error) {
          console.warn('[ProgressScreen] delete failed', error);
        }
      },
    );
  };

  const summary = (entry: Measurement): string => {
    const parts: string[] = [];
    if (entry.weightKg != null) parts.push(`${entry.weightKg} kg`);
    if (entry.chestCm != null) parts.push(`Chest ${entry.chestCm}`);
    if (entry.waistCm != null) parts.push(`Waist ${entry.waistCm}`);
    if (entry.armCm != null) parts.push(`Arm ${entry.armCm}`);
    if (entry.thighCm != null) parts.push(`Thigh ${entry.thighCm}`);
    return parts.join(' · ');
  };

  return (
    <Screen>
      <NavBar large title="Weight & Measures" subtitle="Track your body progress" />
      <Button
        label="Add Measurement"
        icon="add"
        size="md"
        onPress={openAdd}
        style={styles.addButton}
      />

      {latest ? (
        <Card style={styles.latestCard}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            LATEST — {formatShortDate(parseDateKey(latest.dateKey)).toUpperCase()}
          </AppText>
          <View style={styles.latestGrid}>
            <Metric value={latest.weightKg != null ? `${latest.weightKg}` : '—'} unit="kg" label="Weight" />
            <Metric value={latest.chestCm != null ? `${latest.chestCm}` : '—'} unit="cm" label="Chest" />
            <Metric value={latest.waistCm != null ? `${latest.waistCm}` : '—'} unit="cm" label="Waist" />
            <Metric value={latest.armCm != null ? `${latest.armCm}` : '—'} unit="cm" label="Arm" />
            <Metric value={latest.thighCm != null ? `${latest.thighCm}` : '—'} unit="cm" label="Thigh" />
          </View>
          {latest.notes ? (
            <AppText variant="footnote" color={colors.secondaryLabel} style={{ marginTop: 10 }}>
              {latest.notes}
            </AppText>
          ) : null}
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon="body-outline"
            title="No measurements yet"
            message="Log your weight and body measurements to see your progress over time."
          />
        </Card>
      )}

      {weightEntries.length >= 2 ? (
        <Card style={styles.chartCard}>
          <AppText variant="headline">Weight trend</AppText>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            Last {weightEntries.length} entries (kg)
          </AppText>
          <BarChart data={weightEntries} baseline="min" barColor={colors.systemBlue} />
        </Card>
      ) : null}

      {measurements.length > 0 ? (
        <View style={styles.history}>
          <ListGroupHeader label="History" />
          <ListGroup>
            {measurements.map((entry) => (
              <ListRow
                key={entry.id}
                title={formatShortDate(parseDateKey(entry.dateKey))}
                subtitle={summary(entry)}
                icon={{ name: 'speedometer-outline', color: colors.systemTeal }}
                control={
                  <Pressable
                    onPress={(event) => {
                      if (event.stopPropagation) event.stopPropagation();
                      handleDelete(entry);
                    }}
                    hitSlop={10}
                    accessibilityLabel="Delete entry"
                  >
                    <Ionicons name="trash-outline" size={19} color={colors.systemRed} />
                  </Pressable>
                }
                chevron
                onPress={() => openEdit(entry)}
              />
            ))}
          </ListGroup>
        </View>
      ) : null}

      <MeasurementFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        editing={editing}
      />
    </Screen>
  );
}

function Metric({ value, unit, label }: { value: string; unit: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.metric}>
      <View style={styles.metricValueRow}>
        <AppText variant="title2">{value}</AppText>
        <AppText variant="caption1" color={colors.secondaryLabel} style={{ marginBottom: 4 }}>
          {unit}
        </AppText>
      </View>
      <AppText variant="caption1" color={colors.secondaryLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: { marginBottom: 16 },
  latestCard: { gap: 12, marginBottom: 16 },
  latestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  metric: { minWidth: 60, gap: 2 },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  chartCard: { gap: 10, marginBottom: 8 },
  history: { marginTop: 8 },
});
