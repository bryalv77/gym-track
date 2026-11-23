import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import {
  AppText,
  Button,
  Chip,
  ChipRow,
  MANY_CHIPS,
  Ionicons,
  SearchField,
  SheetModal,
  Stepper,
  TextField,
  type IconName,
} from '../ui';
import { useAppSelector } from '../store/hooks';
import { formatMetrics, selectExercisesSorted } from '../store/slices/exercisesSlice';
import { deleteRoutine, saveRoutine } from '../services/routines';
import { exerciseName } from '../utils/defaultExerciseData';
import { metricLabel } from '../utils/exercisePresets';
import { confirmAction } from '../utils/confirm';
import type { Exercise, ExerciseType, Routine } from '../types';
import { useResetOnChange } from '../utils/useResetOnChange';
import { useSubmit } from '../utils/useSubmit';
import { matchesQuery } from '../utils/search';

type TypeFilter = 'all' | ExerciseType;
const TYPE_FILTERS: TypeFilter[] = ['all', 'strength', 'cardio', 'other'];

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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const { saving, error, setError, submit } = useSubmit('RoutineFormModal');

  useResetOnChange([visible, routine], visible, () => {
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
    setExpandedIndex(null);
    setQuery('');
    setTypeFilter('all');
    setError(null);
  });

  const visibleExercises = useMemo(() => {
    return exercises
      .filter((exercise) => typeFilter === 'all' || exercise.type === typeFilter)
      .filter((exercise) => matchesQuery(query, exerciseName(exercise)));
  }, [exercises, query, typeFilter]);

  if (!coach) return null;

  const addExercise = (exercise: Exercise) => {
    setItems((current) => {
      const next = [
        ...current,
        { key: nextKey, exerciseId: exercise.id, metrics: defaultMetrics(exercise), notes: '' },
      ];
      setExpandedIndex(next.length - 1);
      return next;
    });
    setNextKey((key) => key + 1);
    setError(null);
  };

  const updateItem = (key: number, patch: Partial<DraftItem>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const moveItem = (index: number, delta: -1 | 1) => {
    setItems((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setExpandedIndex((currentExpanded) => {
      if (currentExpanded === index) return index + delta;
      if (currentExpanded === index + delta) return index;
      return currentExpanded;
    });
  };

  const removeItem = (index: number, key: number) => {
    setItems((current) => current.filter((it) => it.key !== key));
    setExpandedIndex((currentExpanded) => {
      if (currentExpanded === null) return null;
      if (currentExpanded === index) return null;
      if (currentExpanded > index) return currentExpanded - 1;
      return currentExpanded;
    });
  };

  const handleSave = async () => {
    if (name.trim().length === 0) {
      setError(t('routines.form.nameRequired'));
      return;
    }
    if (items.length === 0) {
      setError(t('routines.form.itemsRequired'));
      return;
    }
    await submit(
      async () => {
        await saveRoutine(coach.uid, {
          ...(routine ? { id: routine.id } : {}),
          name,
          items: items.map(({ exerciseId, metrics, notes }) => ({ exerciseId, metrics, notes })),
        });
        onClose();
      },
      t('routines.form.saveFailed'),
    );
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

  const exerciseChipsList = visibleExercises.map((exercise) => (
    <Chip
      key={exercise.id}
      label={exerciseName(exercise)}
      onPress={() => addExercise(exercise)}
    />
  ));

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={routine ? t('routines.form.editTitle') : t('routines.form.newTitle')}
      confirmDiscard
      footer={
        <View style={styles.footer}>
          {error ? (
            <AppText variant="footnote" color={colors.systemRed}>
              {error}
            </AppText>
          ) : null}
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
            const isExpanded = expandedIndex === index;
            const titleText = exercise
              ? exerciseName(exercise)
              : t('routines.form.missingExercise');
            const summaryText = exercise
              ? formatMetrics(exercise.metricFields, item.metrics)
              : '';
            return (
              <View key={item.key} style={[styles.itemBox, { backgroundColor: colors.background }]}>
                <View style={styles.itemHeader}>
                  <Pressable
                    onPress={() => setExpandedIndex(isExpanded ? null : index)}
                    style={styles.itemTitlePressable}
                  >
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color={colors.secondaryLabel}
                    />
                    <AppText variant="headline" numberOfLines={1} style={{ flex: 1 }}>
                      {isExpanded
                        ? `${index + 1}. ${titleText}`
                        : `${index + 1}. ${titleText}${summaryText ? ` — ${summaryText}` : ''}`}
                    </AppText>
                  </Pressable>
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
                    onPress={() => removeItem(index, item.key)}
                  />
                </View>
                {isExpanded ? (
                  <>
                    {exercise?.metricFields.map((field) => (
                      <Stepper
                        key={field.key}
                        label={`${metricLabel(field)}${field.unit ? ` (${field.unit})` : ''}`}
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
                  </>
                ) : null}
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
          {exercises.length > MANY_CHIPS ? (
            <ChipRow scroll>
              {TYPE_FILTERS.map((filter) => (
                <Chip
                  key={filter}
                  label={t(`library.filters.${filter}`)}
                  selected={typeFilter === filter}
                  onPress={() => setTypeFilter(filter)}
                />
              ))}
            </ChipRow>
          ) : null}
          <ChipRow
            scroll={visibleExercises.length > MANY_CHIPS}
            empty={
              visibleExercises.length === 0 ? (
                <AppText variant="footnote" color={colors.secondaryLabel}>
                  {t('coach.assign.noExerciseMatch', { query })}
                </AppText>
              ) : null
            }
          >
            {exerciseChipsList}
          </ChipRow>
        </View>
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
  itemBox: { gap: 10, borderRadius: radius.md, padding: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitlePressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconButton: { padding: 4 },
  footer: { gap: 10 },
});
