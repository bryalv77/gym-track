import React from 'react';
import { exerciseDescription, exerciseName } from '../utils/defaultExerciseData';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { AppText, Badge, Button, ListGroup, ListRow, SheetModal } from '../ui';
import { formatMetrics } from '../store/slices/exercisesSlice';
import { selectMeasurementsSorted } from '../store/slices/measurementsSlice';
import { useAppSelector } from '../store/hooks';
import { ExerciseMediaView } from './ExerciseMediaView';
import { DEFAULT_BODY_WEIGHT_KG, estimateCalories } from '../utils/calories';
import type { Assignment, Completion, Exercise } from '../types';

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
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const bodyWeight = useAppSelector(
    (state) => selectMeasurementsSorted(state)[0]?.weightKg ?? DEFAULT_BODY_WEIGHT_KG,
  );
  if (!exercise || !assignment) return null;
  const done = completion != null;
  const kcal = estimateCalories(exercise, assignment.metrics, bodyWeight);
  const doneAt = done
    ? new Date((completion as Completion).completedAt).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={exerciseName(exercise)}
      footer={
        <Button
          label={done ? t('member.detail.markNotDone') : t('member.detail.markDone')}
          icon={done ? 'close-circle-outline' : 'checkmark-circle-outline'}
          variant={done ? 'gray' : 'filled'}
          onPress={onToggle}
        />
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
  badgeRow: { flexDirection: 'row', gap: 8 },
});
