import React, { useMemo, useState } from 'react';
import { exerciseName } from '../../utils/defaultExerciseData';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../../theme';
import {
  AppText,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Ionicons,
  ListGroup,
  ListGroupHeader,
  ListRow,
  NavBar,
  ProgressBar,
  Screen,
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectMemberAssignments } from '../../store/slices/assignmentsSlice';
import { selectExerciseById, formatMetrics } from '../../store/slices/exercisesSlice';
import { selectCompletionsForDate } from '../../store/slices/completionsSlice';
import { selectMeasurementsSorted } from '../../store/slices/measurementsSlice';
import { selectSelfieForDate } from '../../store/slices/selfiesSlice';
import { setCompletion } from '../../services/completions';
import { deleteSelfie } from '../../services/selfies';
import { DatePager } from '../../components/DatePager';
import { ExerciseDetailSheet } from '../../components/ExerciseDetailSheet';
import { SelfieFormModal } from '../../components/SelfieFormModal';
import { confirmAction } from '../../utils/confirm';
import { isToday, toDateKey } from '../../utils/date';
import {
  DEFAULT_BODY_WEIGHT_KG,
  estimateCalories,
} from '../../utils/calories';
import type { Assignment, Completion } from '../../types';

/** Member home: their personalized exercises for the day, one checkbox each. */
export function TodayScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const profile = useAppSelector((state) => state.auth.profile);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [detailAssignmentId, setDetailAssignmentId] = useState<string | null>(null);
  const [selfieModalVisible, setSelfieModalVisible] = useState(false);

  const dateKey = toDateKey(selectedDate);
  const assignments = useAppSelector((state) =>
    profile ? selectMemberAssignments(state, dateKey, profile.uid) : [],
  );
  const completions = useAppSelector((state) =>
    profile ? selectCompletionsForDate(state, profile.uid, dateKey) : {},
  );
  const completionDays = useAppSelector((state) =>
    profile ? Object.keys(state.completions.byUser[profile.uid] ?? {}) : [],
  );
  const exercisesById = useAppSelector((state) => state.exercises.byId);
  const latestWeight = useAppSelector(
    (state) => selectMeasurementsSorted(state)[0]?.weightKg ?? DEFAULT_BODY_WEIGHT_KG,
  );
  const selfie = useAppSelector((state) =>
    profile ? selectSelfieForDate(state, profile.uid, dateKey) : undefined,
  );
  const detailAssignment = useAppSelector((state) =>
    detailAssignmentId && state.assignments.byDate[dateKey]
      ? state.assignments.byDate[dateKey][detailAssignmentId] ?? null
      : null,
  );
  const detailExercise = useAppSelector((state) =>
    detailAssignment ? selectExerciseById(state, detailAssignment.exerciseId) : undefined,
  );

  const caloriesFor = (assignment: Assignment): number =>
    estimateCalories(
      exercisesById[assignment.exerciseId],
      assignment.metrics,
      latestWeight,
    );

  const markedDays = new Set(completionDays);

  const doneCount = useMemo(
    () => assignments.filter((assignment) => completions[assignment.id] != null).length,
    [assignments, completions],
  );
  const burnedKcal = useMemo(
    () =>
      assignments
        .filter((assignment) => completions[assignment.id] != null)
        .reduce((total, assignment) => total + caloriesFor(assignment), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignments, completions, exercisesById, latestWeight],
  );
  // Exercises that came from a routine are shown under the routine's name
  // (read-only for the member); individually assigned ones go in their own group.
  const groups = useMemo(() => {
    const routineGroups = new Map<string, { title: string; items: Assignment[] }>();
    const individual: Assignment[] = [];
    for (const assignment of assignments) {
      if (assignment.routineId) {
        const group = routineGroups.get(assignment.routineId) ?? {
          title: assignment.routineName ?? '',
          items: [],
        };
        group.items.push(assignment);
        routineGroups.set(assignment.routineId, group);
      } else {
        individual.push(assignment);
      }
    }
    return { routines: [...routineGroups.values()], individual };
  }, [assignments]);
  const allDone = assignments.length > 0 && doneCount === assignments.length;

  if (!profile) return null;

  const toggle = async (assignment: Assignment) => {
    const done = completions[assignment.id] != null;
    try {
      await setCompletion(profile.uid, dateKey, assignment.id, !done);
    } catch (error) {
      console.warn('[TodayScreen] toggle failed', error);
    }
  };

  const handleDeleteSelfie = () => {
    if (!selfie) return;
    confirmAction(
      t('member.selfie.deleteTitle'),
      t('member.selfie.deleteMessage'),
      async () => {
        try {
          await deleteSelfie(profile.uid, selfie.id);
        } catch (error) {
          console.warn('[TodayScreen] delete selfie failed', error);
        }
      },
    );
  };

  return (
    <Screen>
      <NavBar
        large
        title={t('member.today.title')}
        subtitle={t('member.today.welcome', { name: profile.name.split(' ')[0] })}
      />
      <DatePager date={selectedDate} onChange={setSelectedDate} markedDays={markedDays} />

      {assignments.length === 0 ? (
        <Card>
          <EmptyState
            icon="barbell-outline"
            title={isToday(selectedDate) ? t('member.today.noExercises') : t('member.today.nothingPlanned')}
            message={
              isToday(selectedDate)
                ? t('member.today.noExercisesMsg')
                : t('member.today.nothingPlannedMsg')
            }
          />
        </Card>
      ) : (
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="headline">
                {allDone
                  ? t('member.today.allDone')
                  : t('member.today.progress', { done: doneCount, total: assignments.length })}
              </AppText>
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {allDone
                  ? t('member.today.allDoneMsg')
                  : t('member.today.percent', {
                      percent: Math.round((doneCount / assignments.length) * 100),
                    })}
              </AppText>
            </View>
            <View
              style={[
                styles.checkBadge,
                { backgroundColor: allDone ? colors.systemGreen : colors.fill },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={20}
                color={allDone ? '#FFFFFF' : colors.systemGray2}
              />
            </View>
          </View>
          <ProgressBar
            progress={doneCount / assignments.length}
            color={allDone ? colors.systemGreen : colors.systemBlue}
          />
          <View style={styles.kcalRow}>
            <Ionicons name="flame" size={16} color={colors.systemOrange} />
            <AppText variant="footnote" color={colors.secondaryLabel}>
              ≈ <AppText variant="footnote" style={{ color: colors.systemOrange, fontWeight: '700' }}>
                {t('member.today.kcal', { kcal: burnedKcal })}
              </AppText>{' '}
              {t('member.today.burned', { count: doneCount })}
            </AppText>
          </View>
        </Card>
      )}

      <Card style={styles.selfieCard}>
        {selfie ? (
          <>
            <View style={styles.selfieHeader}>
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {t('member.selfie.header')}
              </AppText>
              <View style={styles.selfieActions}>
                <Pressable
                  onPress={() => setSelfieModalVisible(true)}
                  hitSlop={10}
                  accessibilityLabel={t('member.selfie.editA11y')}
                >
                  <Ionicons name="pencil" size={18} color={colors.systemBlue} />
                </Pressable>
                <Pressable
                  onPress={handleDeleteSelfie}
                  hitSlop={10}
                  accessibilityLabel={t('member.selfie.deleteA11y')}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.systemRed} />
                </Pressable>
              </View>
            </View>
            <Image source={{ uri: selfie.photoData }} style={styles.selfieImage} resizeMode="cover" />
            {selfie.notes ? (
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {selfie.notes}
              </AppText>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.selfieHeader}>
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {t('member.selfie.header')}
              </AppText>
              <AppText variant="footnote" color={colors.tertiaryLabel}>
                {t('common.optional')}
              </AppText>
            </View>
            <Button
              label={isToday(selectedDate) ? t('member.selfie.takeToday') : t('member.selfie.add')}
              icon="camera"
              variant="tinted"
              size="md"
              onPress={() => setSelfieModalVisible(true)}
            />
          </>
        )}
      </Card>

      {assignments.length > 0 ? (
        <View style={styles.list}>
          {[
            ...groups.routines,
            ...(groups.individual.length > 0
              ? [{ title: groups.routines.length > 0 ? t('member.today.otherExercises') : '', items: groups.individual }]
              : []),
          ].map((group, index) => (
            <View key={`${group.title}-${index}`}>
              {group.title ? <ListGroupHeader label={group.title} /> : null}
              <ListGroup>
                {group.items.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    completion={completions[assignment.id]}
                    kcal={caloriesFor(assignment)}
                    onToggle={() => toggle(assignment)}
                    onOpenDetail={() => setDetailAssignmentId(assignment.id)}
                  />
                ))}
              </ListGroup>
            </View>
          ))}
          <AppText variant="caption1" color={colors.tertiaryLabel} style={styles.hint}>
            {t('member.today.hint')}
          </AppText>
        </View>
      ) : null}

      <ExerciseDetailSheet
        visible={detailAssignment != null}
        onClose={() => setDetailAssignmentId(null)}
        exercise={detailExercise}
        assignment={detailAssignment}
        completion={detailAssignment ? completions[detailAssignment.id] : undefined}
        onToggle={() => {
          if (detailAssignment) toggle(detailAssignment);
        }}
      />

      <SelfieFormModal
        visible={selfieModalVisible}
        onClose={() => setSelfieModalVisible(false)}
        dateKey={dateKey}
        editing={selfie ?? null}
      />
    </Screen>
  );
}

function AssignmentRow({
  assignment,
  completion,
  kcal,
  onToggle,
  onOpenDetail,
}: {
  assignment: Assignment;
  completion?: Completion;
  kcal: number;
  onToggle: () => void;
  onOpenDetail: () => void;
}) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const exercise = useAppSelector((state) =>
    selectExerciseById(state, assignment.exerciseId),
  );
  const done = completion != null;
  const summary = exercise ? formatMetrics(exercise.metricFields, assignment.metrics) : '';
  const doneAt = done
    ? ` · ${t('member.today.doneAt', {
        time: new Date(completion.completedAt).toLocaleTimeString(i18n.language, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })}`
    : '';
  const subtitle = done
    ? `${summary}${doneAt} · ~${kcal} ${t('member.units.kcal')}`
    : `${summary} · ~${kcal} ${t('member.units.kcal')}${assignment.notes ? `\n${assignment.notes}` : ''}`;
  const icon =
    exercise?.type === 'cardio'
      ? {
          name: 'speedometer-outline' as const,
          color: colors.systemOrange,
          background: colors.orangeTint,
        }
      : {
          name: 'barbell-outline' as const,
          color: colors.systemBlue,
          background: colors.blueTint,
        };

  return (
    <ListRow
      title={(exercise ? exerciseName(exercise) : null) ?? t('member.today.exercise')}
      subtitle={subtitle}
      icon={icon}
      dimmed={done}
      titleStrike={done}
      control={<Checkbox checked={done} onPress={onToggle} />}
      onPress={onOpenDetail}
    />
  );
}

const styles = StyleSheet.create({
  progressCard: { marginBottom: 16, gap: 12 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selfieCard: { marginBottom: 16, gap: 10 },
  selfieHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selfieActions: { flexDirection: 'row', gap: 14 },
  selfieImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    maxHeight: 320,
    overflow: 'hidden',
  },
  list: { borderRadius: radius.md, overflow: 'hidden', gap: 8 },
  hint: { marginLeft: 4 },
});
