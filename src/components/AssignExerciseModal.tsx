import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../theme';
import {
  AppText,
  Avatar,
  Button,
  Chip,
  SearchField,
  SheetModal,
  Stepper,
  TextField,
} from '../ui';
import { useAppSelector } from '../store/hooks';
import { selectGymMembers } from '../store/slices/membersSlice';
import { selectExercisesSorted } from '../store/slices/exercisesSlice';
import {
  createAssignment,
  deleteAssignment,
  updateAssignment,
} from '../services/assignments';
import { confirmAction } from '../utils/confirm';
import type { Assignment, Exercise, MetricField } from '../types';

/**
 * Coach sheet to assign a library exercise to a member for a given day and
 * set the metric values (sets/reps/weight, minutes/speed…). Also edits and
 * unassigns existing assignments.
 */
export function AssignExerciseModal({
  visible,
  onClose,
  dateKey,
  /** null = new assignment */
  assignment,
  initialMemberId,
}: {
  visible: boolean;
  onClose: () => void;
  dateKey: string;
  assignment: Assignment | null;
  initialMemberId?: string | null;
}) {
  const { colors } = useTheme();
  const coach = useAppSelector((state) => state.auth.profile);
  const gymMembers = useAppSelector((state) =>
    selectGymMembers(state, state.auth.profile?.gymId),
  );
  const exercises = useAppSelector(selectExercisesSorted);
  const [exerciseQuery, setExerciseQuery] = useState('');

  const [memberId, setMemberId] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedExercise: Exercise | undefined = useMemo(
    () => exercises.find((exercise) => exercise.id === exerciseId),
    [exercises, exerciseId],
  );

  const visibleExercises = useMemo(() => {
    const needle = exerciseQuery.trim().toLowerCase();
    if (needle.length === 0) return exercises;
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(needle));
  }, [exercises, exerciseQuery]);

  useEffect(() => {
    if (!visible) return;
    setMemberId(assignment?.memberId ?? initialMemberId ?? null);
    setExerciseId(assignment?.exerciseId ?? null);
    setNotes(assignment?.notes ?? '');
    setExerciseQuery('');
    setError(null);
  }, [visible, assignment, initialMemberId]);

  // When an exercise is picked, initialize metrics with the assignment's
  // existing values or the exercise defaults.
  useEffect(() => {
    if (!visible || !selectedExercise) return;
    const initial: Record<string, number> = {};
    for (const field of selectedExercise.metricFields) {
      initial[field.key] =
        assignment && assignment.exerciseId === selectedExercise.id
          ? assignment.metrics[field.key] ?? field.defaultValue
          : field.defaultValue;
    }
    setMetrics(initial);
  }, [visible, selectedExercise, assignment]);

  if (!coach) return null;

  const handleSave = async () => {
    if (!memberId) {
      setError('Pick a member.');
      return;
    }
    if (!selectedExercise) {
      setError('Pick an exercise from the library.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (assignment) {
        await updateAssignment(dateKey, assignment.id, {
          exerciseId: selectedExercise.id,
          memberId,
          metrics,
          notes: notes.trim() || undefined,
        });
      } else {
        await createAssignment({
          dateKey,
          exerciseId: selectedExercise.id,
          memberId,
          coachId: coach.uid,
          metrics,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (saveError) {
      console.warn('[AssignExerciseModal] save failed', saveError);
      setError('Could not save. Check your connection and rules.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = () => {
    if (!assignment) return;
    confirmAction(
      'Unassign Exercise',
      'The exercise will be removed from this member’s day.',
      async () => {
        try {
          await deleteAssignment(dateKey, assignment.id);
          onClose();
        } catch (deleteError) {
          console.warn('[AssignExerciseModal] unassign failed', deleteError);
        }
      },
      'Unassign',
    );
  };

  const memberChips = assignment ? (
    <View style={[styles.memberPill, { backgroundColor: colors.background }]}>
      <Avatar
        name={gymMembers.find((member) => member.uid === assignment.memberId)?.name ?? 'Member'}
        size={26}
        photoUrl={gymMembers.find((member) => member.uid === assignment.memberId)?.photoData}
      />
      <AppText variant="subheadline">
        {gymMembers.find((member) => member.uid === assignment.memberId)?.name ?? 'Member'}
      </AppText>
    </View>
  ) : (
    <View style={styles.chips}>
      {gymMembers.map((member) => (
        <Chip
          key={member.uid}
          label={member.name}
          selected={memberId === member.uid}
          onPress={() => setMemberId(member.uid)}
        />
      ))}
      {gymMembers.length === 0 ? (
        <AppText variant="footnote" color={colors.secondaryLabel}>
          No members in your gym yet.
        </AppText>
      ) : null}
    </View>
  );

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={assignment ? 'Edit Assignment' : 'Assign Exercise'}
      footer={
        <View style={styles.footer}>
          {assignment ? (
            <Button
              label="Unassign"
              variant="destructive"
              onPress={handleUnassign}
              disabled={saving}
            />
          ) : null}
          <Button
            label={assignment ? 'Save Changes' : 'Assign'}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      }
    >
      <View style={styles.form}>
        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            MEMBER
          </AppText>
          {memberChips}
        </View>

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            EXERCISE FROM LIBRARY
          </AppText>
          <SearchField
            value={exerciseQuery}
            onChangeText={setExerciseQuery}
            placeholder="Search exercises"
          />
          <View style={styles.chips}>
            {visibleExercises.map((exercise) => (
              <Chip
                key={exercise.id}
                label={exercise.name}
                selected={exerciseId === exercise.id}
                onPress={() => setExerciseId(exercise.id)}
              />
            ))}
            {visibleExercises.length === 0 ? (
              <AppText variant="footnote" color={colors.secondaryLabel}>
                No exercise matches “{exerciseQuery}”.
              </AppText>
            ) : null}
          </View>
        </View>

        {selectedExercise ? (
          <View style={styles.section}>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              PRESCRIPTION — {selectedExercise.name.toUpperCase()}
            </AppText>
            <View style={[styles.metricsBox, { backgroundColor: colors.background }]}>
              {selectedExercise.metricFields.map((field: MetricField) => (
                <Stepper
                  key={field.key}
                  label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                  value={metrics[field.key] ?? field.defaultValue}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(value) =>
                    setMetrics((current) => ({ ...current, [field.key]: value }))
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        <TextField
          label="Notes (optional)"
          placeholder="Cues, rest time, alternatives…"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        {error ? (
          <AppText variant="footnote" color={colors.systemRed}>
            {error}
          </AppText>
        ) : null}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, paddingBottom: 8 },
  section: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    padding: 10,
    alignSelf: 'flex-start',
  },
  metricsBox: { gap: 10, borderRadius: radius.md, padding: 12 },
  footer: { gap: 10 },
});
