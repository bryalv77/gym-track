import React, { useState } from 'react';
import { exerciseDescription, exerciseName } from '../utils/defaultExerciseData';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import { AppText, Badge, Button, ListGroup, ListRow, SheetModal } from '../ui';
import { formatMetrics } from '../store/slices/exercisesSlice';
import { selectMeasurementsSorted } from '../store/slices/measurementsSlice';
import { useAppSelector } from '../store/hooks';
import { ExerciseMediaView } from './ExerciseMediaView';
import { DEFAULT_BODY_WEIGHT_KG, estimateCalories } from '../utils/calories';
import { formatTime } from '../utils/date';
import { metricLabel } from '../utils/exercisePresets';
import type { Assignment, Completion, Exercise } from '../types';
import { useResetOnChange } from '../utils/useResetOnChange';
import { errorMessage } from '../utils/errorMessage';

/** Member view of one assigned exercise: demo media, technique notes, the
 *  coach's prescription and the big done/undone button. */
export function ExerciseDetailSheet({
  visible,
  onClose,
  exercise,
  assignment,
  completion,
  onToggle,
}: {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise | undefined;
  assignment: Assignment | null;
  completion?: Completion;
  onToggle: () => void | Promise<void>;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const bodyWeight = useAppSelector(
    (state) => selectMeasurementsSorted(state)[0]?.weightKg ?? DEFAULT_BODY_WEIGHT_KG,
  );
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useResetOnChange([visible, assignment?.id], () => {
    setToggleError(null);
    setToggling(false);
  });

  if (!exercise || !assignment) return null;
  const done = completion != null;
  const kcal = estimateCalories(exercise, assignment.metrics, bodyWeight);
  const doneAt = completion ? formatTime(completion.completedAt) : null;

  const handleToggle = async () => {
    setToggleError(null);
    setToggling(true);
    try {
      await onToggle();
    } catch (error) {
      setToggleError(
        errorMessage(error, t('common.genericError')),
      );
    } finally {
      setToggling(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={exerciseName(exercise)}
      footer={
        <View style={styles.footerWrap}>
          {toggleError ? (
            <AppText variant="footnote" color={colors.systemRed} align="center">
              {toggleError}
            </AppText>
          ) : null}
          <Button
            label={done ? t('member.detail.markNotDone') : t('member.detail.markDone')}
            icon={done ? 'close-circle-outline' : 'checkmark-circle-outline'}
            variant={done ? 'gray' : 'filled'}
            onPress={handleToggle}
            loading={toggling}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <ExerciseMediaView exercise={exercise} />
        <View style={styles.badgeRow}>
          <Badge
            label={
              t(`member.detail.types.${exercise.type === 'strength' || exercise.type === 'cardio' ? exercise.type : 'general'}`)
            }
            variant={exercise.type === 'cardio' ? 'orange' : 'blue'}
          />
          {done && doneAt ? <Badge label={t('member.detail.doneAt', { time: doneAt })} variant="green" /> : null}
        </View>
        {exerciseDescription(exercise) ? (
          <AppText variant="subheadline" color={colors.secondaryLabel}>
            {exerciseDescription(exercise)}
          </AppText>
        ) : null}
        {exercise.metricFields.length > 0 ? (
          <View style={styles.metricTilesRow}>
            {exercise.metricFields.map((f) => {
              const value = assignment.metrics[f.key];
              return (
                <View
                  key={f.key}
                  style={[styles.metricTile, { backgroundColor: colors.fill }]}
                >
                  <View style={styles.metricValueRow}>
                    <AppText variant="title2" style={styles.tabularNums}>
                      {value ?? '—'}
                    </AppText>
                    {f.unit ? (
                      <AppText
                        variant="caption1"
                        color={colors.secondaryLabel}
                        style={styles.metricUnit}
                      >
                        {f.unit}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="caption1" color={colors.secondaryLabel}>
                    {metricLabel(f)}
                  </AppText>
                </View>
              );
            })}
          </View>
        ) : null}
        <ListGroup>
          <ListRow
            title={t('member.detail.prescription')}
            subtitle={formatMetrics(exercise.metricFields, assignment.metrics)}
            icon={{ name: 'clipboard-outline' }}
          />
          <ListRow
            title={t('member.detail.estimatedBurn')}
            subtitle={t('member.detail.burnBasis', { kcal, weight: bodyWeight })}
            icon={{ name: 'flame-outline', color: colors.systemOrange, background: colors.orangeTint }}
          />
          {assignment.notes ? (
            <ListRow
              title={t('member.detail.coachNotes')}
              subtitle={assignment.notes}
              icon={{ name: 'chatbubble-ellipses-outline', color: colors.systemPurple }}
            />
          ) : null}
        </ListGroup>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metricTilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricTile: {
    flex: 1,
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 2,
  },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  metricUnit: { fontWeight: '600' },
  tabularNums: { fontVariant: ['tabular-nums'] },
  footerWrap: { gap: 8 },
});
