import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../../theme';
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
import { selectSelfiesSorted } from '../../store/slices/selfiesSlice';
import { deleteMeasurement } from '../../services/measurements';
import { deleteSelfie } from '../../services/selfies';
import { MeasurementFormModal } from '../../components/MeasurementFormModal';
import { SelfieFormModal } from '../../components/SelfieFormModal';
import { confirmAction } from '../../utils/confirm';
import { formatShortDate, formatMonthDay, parseDateKey } from '../../utils/date';
import type { DailySelfie, Measurement } from '../../types';

/** Weight & body measurements: latest snapshot, weight trend and history. */
export function ProgressScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const profile = useAppSelector((state) => state.auth.profile);
  const measurements = useAppSelector(selectMeasurementsSorted);
  const selfies = useAppSelector(selectSelfiesSorted);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);
  const [selfieModalVisible, setSelfieModalVisible] = useState(false);
  const [editingSelfie, setEditingSelfie] = useState<DailySelfie | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (entry: Measurement) => {
    setEditing(entry);
    setFormVisible(true);
  };

  const openEditSelfie = (entry: DailySelfie) => {
    setEditingSelfie(entry);
    setSelfieModalVisible(true);
  };

  const handleDeleteSelfie = (entry: DailySelfie) => {
    if (!profile) return;
    confirmAction(
      t('member.selfie.deleteTitle'),
      t('member.selfie.deleteMessage'),
      async () => {
        try {
          await deleteSelfie(profile.uid, entry.id);
        } catch (error) {
          console.warn('[ProgressScreen] delete selfie failed', error);
        }
      },
    );
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
      t('member.progress.deleteTitle'),
      t('member.progress.deleteMessage'),
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
    if (entry.weightKg != null) parts.push(`${entry.weightKg} ${t('member.units.kg')}`);
    if (entry.chestCm != null) parts.push(`${t('member.progress.chest')} ${entry.chestCm}`);
    if (entry.waistCm != null) parts.push(`${t('member.progress.waist')} ${entry.waistCm}`);
    if (entry.armCm != null) parts.push(`${t('member.progress.arm')} ${entry.armCm}`);
    if (entry.thighCm != null) parts.push(`${t('member.progress.thigh')} ${entry.thighCm}`);
    return parts.join(' · ');
  };

  return (
    <Screen>
      <NavBar large title={t('member.progress.title')} subtitle={t('member.progress.subtitle')} />
      <Button
        label={t('member.progress.add')}
        icon="add"
        size="md"
        onPress={openAdd}
        style={styles.addButton}
      />

      {latest ? (
        <Card style={styles.latestCard}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('member.progress.latest', { date: formatShortDate(parseDateKey(latest.dateKey)) }).toUpperCase()}
          </AppText>
          <View style={styles.latestGrid}>
            <Metric value={latest.weightKg != null ? `${latest.weightKg}` : '—'} unit={t('member.units.kg')} label={t('member.progress.weight')} />
            <Metric value={latest.chestCm != null ? `${latest.chestCm}` : '—'} unit={t('member.units.cm')} label={t('member.progress.chest')} />
            <Metric value={latest.waistCm != null ? `${latest.waistCm}` : '—'} unit={t('member.units.cm')} label={t('member.progress.waist')} />
            <Metric value={latest.armCm != null ? `${latest.armCm}` : '—'} unit={t('member.units.cm')} label={t('member.progress.arm')} />
            <Metric value={latest.thighCm != null ? `${latest.thighCm}` : '—'} unit={t('member.units.cm')} label={t('member.progress.thigh')} />
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
            title={t('member.progress.noneTitle')}
            message={t('member.progress.noneMsg')}
          />
        </Card>
      )}

      {weightEntries.length >= 2 ? (
        <Card style={styles.chartCard}>
          <AppText variant="headline">{t('member.progress.trend')}</AppText>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('member.progress.lastEntries', { count: weightEntries.length })}
          </AppText>
          <BarChart data={weightEntries} baseline="min" barColor={colors.systemBlue} />
        </Card>
      ) : null}

      {measurements.length > 0 ? (
        <View style={styles.history}>
          <ListGroupHeader label={t('member.progress.history')} />
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
                    accessibilityLabel={t('member.progress.deleteEntry')}
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

      {selfies.length > 0 ? (
        <View style={styles.history}>
          <ListGroupHeader label={t('member.progress.selfieTimeline')} />
          <ListGroup>
            {selfies.map((entry) => (
              <ListRow
                key={entry.id}
                title={formatShortDate(parseDateKey(entry.dateKey))}
                subtitle={entry.notes || t('member.selfie.daily')}
                leading={
                  <Image
                    source={{ uri: entry.photoData }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                }
                control={
                  <Pressable
                    onPress={(event) => {
                      if (event.stopPropagation) event.stopPropagation();
                      handleDeleteSelfie(entry);
                    }}
                    hitSlop={10}
                    accessibilityLabel={t('member.selfie.deleteA11y')}
                  >
                    <Ionicons name="trash-outline" size={19} color={colors.systemRed} />
                  </Pressable>
                }
                chevron
                onPress={() => openEditSelfie(entry)}
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

      <SelfieFormModal
        visible={selfieModalVisible}
        onClose={() => setSelfieModalVisible(false)}
        dateKey={editingSelfie?.dateKey ?? ''}
        editing={editingSelfie}
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
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
