import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import {
  AppText,
  Button,
  SegmentedControl,
  SheetModal,
  TextField,
  Ionicons,
} from '../ui';
import { useAppSelector } from '../store/hooks';
import { createExercise, deleteExercise, updateExercise } from '../services/exercises';
import { selectExerciseById } from '../store/slices/exercisesSlice';
import {
  EXERCISE_PRESETS,
  exerciseTypeLabel,
  slugifyKey,
} from '../utils/exercisePresets';
import { confirmAction } from '../utils/confirm';
import type { Exercise, ExerciseType, MetricField } from '../types';

const TYPE_OPTIONS: ExerciseType[] = ['strength', 'cardio', 'other'];

/** Sheet to create/edit a library exercise: type preset, editable metric
 *  fields, description and demo media (image/GIF + video link). */
export function ExerciseFormModal({
  visible,
  onClose,
  exerciseId,
}: {
  visible: boolean;
  onClose: () => void;
  /** null = create */
  exerciseId: string | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const profile = useAppSelector((state) => state.auth.profile);
  const editing = useAppSelector((state) =>
    exerciseId ? selectExerciseById(state, exerciseId) : undefined,
  );

  const [name, setName] = useState('');
  const [type, setType] = useState<ExerciseType>('strength');
  const [fields, setFields] = useState<MetricField[]>(EXERCISE_PRESETS.strength);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [met, setMet] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-initialize the form whenever it opens or its inputs change.
  const [synced1, setSynced1] = useState<unknown[]>([]);
  const deps1 = [visible, editing];
  if (deps1.some((value, index) => value !== synced1[index])) {
    setSynced1(deps1);
    if (visible) {
      setName(editing?.name ?? '');
      setType(editing?.type ?? 'strength');
      setFields(
        editing && editing.metricFields.length > 0
          ? editing.metricFields
          : EXERCISE_PRESETS[editing?.type ?? 'strength'],
      );
      setImageUrl(editing?.imageUrl ?? '');
      setVideoUrl(editing?.videoUrl ?? '');
      setDescription(editing?.description ?? '');
      setMet(editing?.met != null ? String(editing.met) : '');
      setError(null);
    }
  }

  if (!profile) return null;

  const patchField = (index: number, patch: Partial<MetricField>) => {
    setFields((current) =>
      current.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  };

  const addField = () => {
    setFields((current) => [
      ...current,
      {
        key: slugifyKey('new metric', current.map((field) => field.key)),
        label: t('library.form.newMetric'),
        unit: '',
        min: 0,
        max: 999,
        step: 1,
        defaultValue: 10,
      },
    ]);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(t('library.form.errors.nameRequired'));
      return;
    }
    const cleanFields = fields
      .map((field) => ({ ...field, label: field.label.trim() || field.key }))
      .filter((field) => field.key.length > 0);
    if (cleanFields.length === 0) {
      setError(t('library.form.errors.metricRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    const metValue = Number(met.trim().replace(',', '.'));
    const payload = {
      name: trimmed,
      type,
      metricFields: cleanFields,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      ...(Number.isFinite(metValue) && metValue > 0 ? { met: metValue } : {}),
    };
    try {
      if (editing) {
        await updateExercise(editing.id, payload);
      } else {
        await createExercise({ ...payload, createdBy: profile.uid });
      }
      onClose();
    } catch (saveError) {
      console.warn('[ExerciseFormModal] save failed', saveError);
      setError(t('library.form.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    confirmAction(
      t('library.form.deleteTitle'),
      t('library.form.deleteMessage', { name: editing.name }),
      async () => {
        try {
          await deleteExercise(editing.id);
          onClose();
        } catch (deleteError) {
          console.warn('[ExerciseFormModal] delete failed', deleteError);
        }
      },
    );
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={editing ? t('library.form.editTitle') : t('library.form.newTitle')}
      footer={
        <View style={styles.footer}>
          {editing ? (
            <Button label={t('common.delete')} variant="destructive" onPress={handleDelete} disabled={saving} />
          ) : null}
          <Button
            label={editing ? t('library.form.saveChanges') : t('library.form.addToLibrary')}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      }
    >
      <View style={styles.form}>
        <TextField
          label={t('library.form.name')}
          placeholder={t('library.form.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('library.form.typeHeader')}
          </AppText>
          <SegmentedControl
            options={TYPE_OPTIONS.map((option) => exerciseTypeLabel(option))}
            selectedIndex={TYPE_OPTIONS.indexOf(type)}
            onChange={(index) => {
              const next = TYPE_OPTIONS[index];
              setType(next);
              setFields(EXERCISE_PRESETS[next]);
            }}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('library.form.metrics')}
          </AppText>
          {fields.map((field, index) => (
            <View key={field.key} style={[styles.fieldRow, { backgroundColor: colors.background }]}>
              <View style={styles.fieldInputs}>
                <TextField
                  label={t('library.form.label')}
                  value={field.label}
                  onChangeText={(text) => patchField(index, { label: text })}
                  style={{ height: 40, fontSize: 15 }}
                />
                <TextField
                  label={t('library.form.unit')}
                  value={field.unit}
                  onChangeText={(text) => patchField(index, { unit: text })}
                  style={{ height: 40, fontSize: 15 }}
                  autoCapitalize="none"
                />
                <TextField
                  label={t('library.form.default')}
                  value={String(field.defaultValue)}
                  onChangeText={(text) =>
                    patchField(index, {
                      defaultValue: Number(text.replace(',', '.')) || 0,
                    })
                  }
                  keyboardType="numeric"
                  style={{ height: 40, fontSize: 15 }}
                />
              </View>
              <Pressable
                onPress={() =>
                  setFields((current) => current.filter((_, i) => i !== index))
                }
                hitSlop={8}
                accessibilityLabel={t('library.form.remove', { label: field.label })}
                disabled={fields.length <= 1}
                style={styles.removeButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={fields.length <= 1 ? colors.tertiaryLabel : colors.systemRed}
                />
              </Pressable>
            </View>
          ))}
          <Button label={t('library.form.addMetric')} variant="gray" size="sm" icon="add" onPress={addField} />
        </View>

        <TextField
          label={t('library.form.imageUrl')}
          placeholder="https://…/bench-press.gif"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextField
          label={t('library.form.videoUrl')}
          placeholder="https://youtube.com/watch?v=…"
          value={videoUrl}
          onChangeText={setVideoUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextField
          label={t('library.form.met')}
          placeholder={t('library.form.metPlaceholder')}
          value={met}
          onChangeText={setMet}
          keyboardType="numeric"
        />
        <TextField
          label={t('library.form.description')}
          placeholder={t('library.form.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
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
  form: { gap: 14, paddingBottom: 8 },
  section: { gap: 8 },
  footer: { gap: 10 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    padding: 10,
  },
  fieldInputs: { flex: 1, flexDirection: 'row', gap: 8 },
  removeButton: { padding: 6 },
});
