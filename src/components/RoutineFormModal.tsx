import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import {
  AppText,
  Button,
  Chip,
  Ionicons,
  SearchField,
  SheetModal,
  Stepper,
  TextField,
  type IconName,
} from '../ui';
import { useAppSelector } from '../store/hooks';
import { selectExercisesSorted } from '../store/slices/exercisesSlice';
import { deleteRoutine, saveRoutine } from '../services/routines';
import { exerciseName } from '../utils/defaultExerciseData';
import { confirmAction } from '../utils/confirm';
import type { Exercise, Routine } from '../types';

interface DraftItem {
  /** Local key so rows keep their identity while reordering. */
  key: number;
  exerciseId: string;
  metrics: Record<string, number>;
  notes: string;
}

function defaultMetrics(exercise: Exercise): Record<string, number> {
  const metrics: Record<string, number> = {};
  for (const field of exercise.metricFields) metrics[field.key] = field.defaultValue;
  return metrics;
}

/** Coach sheet to create, edit or delete one of their routines. */
export function RoutineFormModal({
  visible,
  onClose,
  routine,
}: {
  visible: boolean;
  onClose: () => void;
  /** null = new routine */
  routine: Routine | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const coach = useAppSelector((state) => state.auth.profile);
  const exercises = useAppSelector(selectExercisesSorted);
  const exercisesById = useAppSelector((state) => state.exercises.byId);

  const [name, setName] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-initialize the form whenever it opens or its inputs change.
  const [synced, setSynced] = useState<unknown[]>([]);
  const deps = [visible, routine];
  if (deps.some((value, index) => value !== synced[index])) {
    setSynced(deps);
    if (visible) {
      setName(routine?.name ?? '');
      setItems(
        (routine?.items ?? []).map((item, index) => ({
          key: index,
          exerciseId: item.exerciseId,
          metrics: item.metrics,
          notes: item.notes ?? '',
        })),
      );
      setNextKey(routine?.items.length ?? 0);
      setQuery('');
      setError(null);
    }
  }

  const visibleExercises = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return exercises;
    return exercises.filter((exercise) => exerciseName(exercise).toLowerCase().includes(needle));
  }, [exercises, query]);

  if (!coach) return null;

  const addExercise = (exercise: Exercise) => {
    setItems((current) => [
      ...current,
      { key: nextKey, exerciseId: exercise.id, metrics: defaultMetrics(exercise), notes: '' },
    ]);
    setNextKey((key) => key + 1);
    setError(null);
  };

  const updateItem = (key: number, patch: Partial<DraftItem>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const moveItem = (index: number, delta: -1 | 1) =>
    setItems((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSave = async () => {
    if (name.trim().length === 0) {
      setError(t('routines.form.nameRequired'));
      return;
    }
    if (items.length === 0) {
      setError(t('routines.form.itemsRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveRoutine(coach.uid, {
        ...(routine ? { id: routine.id } : {}),
        name,
        items: items.map(({ exerciseId, metrics, notes }) => ({ exerciseId, metrics, notes })),
      });
      onClose();
    } catch (saveError) {
      console.warn('[RoutineFormModal] save failed', saveError);
      setError(t('routines.form.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!routine) return;
    confirmAction(
      t('routines.form.deleteTitle'),
      t('routines.form.deleteMessage'),
      async () => {
        try {
          await deleteRoutine(coach.uid, routine.id);
          onClose();
        } catch (deleteError) {
          console.warn('[RoutineFormModal] delete failed', deleteError);
          setError(t('routines.form.saveFailed'));
        }
      },
    );
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={routine ? t('routines.form.editTitle') : t('routines.form.newTitle')}
      footer={
        <View style={styles.footer}>
          {routine ? (
            <Button
              label={t('routines.form.delete')}
              variant="destructive"
              onPress={handleDelete}
              disabled={saving}
            />
          ) : null}
          <Button
            label={routine ? t('routines.form.saveChanges') : t('routines.form.create')}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      }
    >
      <View style={styles.form}>
        <TextField
          label={t('routines.form.nameLabel')}
          placeholder={t('routines.form.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
        />

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('routines.form.exercisesHeader', { count: items.length })}
          </AppText>
          {items.length === 0 ? (
            <AppText variant="footnote" color={colors.tertiaryLabel}>
              {t('routines.form.noExercises')}
            </AppText>
          ) : null}
          {items.map((item, index) => {
            const exercise = exercisesById[item.exerciseId];
            return (
              <View key={item.key} style={[styles.itemBox, { backgroundColor: colors.background }]}>
                <View style={styles.itemHeader}>
                  <AppText variant="headline" style={{ flex: 1 }}>
                    {`${index + 1}. ${exercise ? exerciseName(exercise) : t('routines.form.missingExercise')}`}
                  </AppText>
                  <IconButton
                    name="chevron-up"
                    label={t('routines.form.moveUp')}
                    disabled={index === 0}
                    onPress={() => moveItem(index, -1)}
                  />
                  <IconButton
                    name="chevron-down"
                    label={t('routines.form.moveDown')}
                    disabled={index === items.length - 1}
                    onPress={() => moveItem(index, 1)}
                  />
                  <IconButton
                    name="trash-outline"
                    label={t('routines.form.remove')}
                    color={colors.systemRed}
                    onPress={() => setItems((current) => current.filter((it) => it.key !== item.key))}
                  />
                </View>
                {exercise?.metricFields.map((field) => (
                  <Stepper
                    key={field.key}
                    label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                    value={item.metrics[field.key] ?? field.defaultValue}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(value) =>
                      updateItem(item.key, { metrics: { ...item.metrics, [field.key]: value } })
                    }
                  />
                ))}
                <TextField
                  placeholder={t('routines.form.itemNotes')}
                  value={item.notes}
                  onChangeText={(notes) => updateItem(item.key, { notes })}
                  multiline
                />
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('routines.form.addHeader')}
          </AppText>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={t('coach.assign.searchExercises')}
          />
          <View style={styles.chips}>
            {visibleExercises.map((exercise) => (
              <Chip
                key={exercise.id}
                label={exerciseName(exercise)}
                onPress={() => addExercise(exercise)}
              />
            ))}
            {visibleExercises.length === 0 ? (
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {t('coach.assign.noExerciseMatch', { query })}
              </AppText>
            ) : null}
          </View>
        </View>

        {error ? (
          <AppText variant="footnote" color={colors.systemRed}>
            {error}
          </AppText>
        ) : null}
      </View>
    </SheetModal>
  );
}

function IconButton({
  name,
  label,
  onPress,
  disabled,
  color,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityLabel={label}
      style={[styles.iconButton, disabled && { opacity: 0.3 }]}
    >
      <Ionicons name={name} size={20} color={color ?? colors.systemBlue} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, paddingBottom: 8 },
  section: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemBox: { gap: 10, borderRadius: radius.md, padding: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconButton: { padding: 4 },
  footer: { gap: 10 },
});
