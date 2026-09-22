import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
  EXERCISE_TYPE_LABELS,
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

  useEffect(() => {
    if (!visible) return;
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
  }, [visible, editing]);

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
        label: 'new metric',
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
      setError('Give the exercise a name.');
      return;
    }
    const cleanFields = fields
      .map((field) => ({ ...field, label: field.label.trim() || field.key }))
      .filter((field) => field.key.length > 0);
    if (cleanFields.length === 0) {
      setError('Add at least one metric (sets/reps, minutes/speed…).');
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
      setError('Could not save. Check your connection and rules.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    confirmAction(
      'Delete Exercise',
      `"${editing.name}" will be removed from the library. Existing assignments keep working but lose their demo media.`,
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
      title={editing ? 'Edit Exercise' : 'New Exercise'}
      footer={
        <View style={styles.footer}>
          {editing ? (
            <Button label="Delete" variant="destructive" onPress={handleDelete} disabled={saving} />
          ) : null}
          <Button
            label={editing ? 'Save Changes' : 'Add to Library'}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      }
    >
      <View style={styles.form}>
        <TextField
          label="Name"
          placeholder="e.g. Bench Press"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            TYPE — determines the metrics coaches set per member
          </AppText>
          <SegmentedControl
            options={TYPE_OPTIONS.map((option) => EXERCISE_TYPE_LABELS[option])}
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
            METRICS
          </AppText>
          {fields.map((field, index) => (
            <View key={field.key} style={[styles.fieldRow, { backgroundColor: colors.background }]}>
              <View style={styles.fieldInputs}>
                <TextField
                  label="Label"
                  value={field.label}
                  onChangeText={(text) => patchField(index, { label: text })}
                  style={{ height: 40, fontSize: 15 }}
                />
                <TextField
                  label="Unit"
                  value={field.unit}
                  onChangeText={(text) => patchField(index, { unit: text })}
                  style={{ height: 40, fontSize: 15 }}
                  autoCapitalize="none"
                />
                <TextField
                  label="Default"
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
                accessibilityLabel={`Remove ${field.label}`}
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
          <Button label="Add metric" variant="gray" size="sm" icon="add" onPress={addField} />
        </View>

        <TextField
          label="Image / GIF URL (optional)"
          placeholder="https://…/bench-press.gif"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextField
          label="Video URL (optional, YouTube…)"
          placeholder="https://youtube.com/watch?v=…"
          value={videoUrl}
          onChangeText={setVideoUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextField
          label="Intensity MET (optional, for calorie estimate)"
          placeholder="Strength ≈ 5 · Cardio ≈ 7 · Elite ≈ 10+"
          value={met}
          onChangeText={setMet}
          keyboardType="numeric"
        />
        <TextField
          label="How to perform it (optional)"
          placeholder="Technique cues, tempo, breathing…"
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
