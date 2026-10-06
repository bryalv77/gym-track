import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import { AppText, Button, SheetModal, TextField } from '../ui';
import { useAppSelector } from '../store/hooks';
import { addMeasurement, updateMeasurement } from '../services/measurements';
import { isValidDateKey, toDateKey } from '../utils/date';
import { parseOptionalNumber } from '../utils/numbers';

const NUMERIC = 'numeric' as const;

/** Sheet to log or edit a weight & body measurements entry. */
export function MeasurementFormModal({
  visible,
  onClose,
  /** null = new entry */
  editing,
}: {
  visible: boolean;
  onClose: () => void;
  editing?: import('../types').Measurement | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const profile = useAppSelector((state) => state.auth.profile);

  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-initialize the form whenever it opens or its inputs change.
  const [synced1, setSynced1] = useState<unknown[]>([]);
  const deps1 = [visible, editing];
  if (deps1.some((value, index) => value !== synced1[index])) {
    setSynced1(deps1);
    if (visible) {
      setDateKey(editing?.dateKey ?? toDateKey(new Date()));
      setWeight(editing?.weightKg != null ? String(editing.weightKg) : '');
      setChest(editing?.chestCm != null ? String(editing.chestCm) : '');
      setWaist(editing?.waistCm != null ? String(editing.waistCm) : '');
      setArm(editing?.armCm != null ? String(editing.armCm) : '');
      setThigh(editing?.thighCm != null ? String(editing.thighCm) : '');
      setNotes(editing?.notes ?? '');
      setError(null);
    }
  }

  if (!profile) return null;

  const handleSave = async () => {
    if (!isValidDateKey(dateKey.trim())) {
      setError(t('member.measure.dateError'));
      return;
    }
    const weightKg = parseOptionalNumber(weight);
    const chestCm = parseOptionalNumber(chest);
    const waistCm = parseOptionalNumber(waist);
    const armCm = parseOptionalNumber(arm);
    const thighCm = parseOptionalNumber(thigh);
    if (
      weightKg === undefined &&
      chestCm === undefined &&
      waistCm === undefined &&
      armCm === undefined &&
      thighCm === undefined
    ) {
      setError(t('member.measure.needOne'));
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      dateKey: dateKey.trim(),
      weightKg,
      chestCm,
      waistCm,
      armCm,
      thighCm,
      notes: notes.trim() || undefined,
    };
    try {
      if (editing) {
        await updateMeasurement(profile.uid, {
          ...payload,
          id: editing.id,
          createdAt: editing.createdAt,
        });
      } else {
        await addMeasurement(profile.uid, payload);
      }
      onClose();
    } catch (saveError) {
      console.warn('[MeasurementFormModal] save failed', saveError);
      setError(t('member.selfie.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={editing ? t('member.measure.editTitle') : t('member.progress.add')}
      footer={<Button label={editing ? t('member.selfie.saveChanges') : t('member.measure.save')} onPress={handleSave} loading={saving} />}
    >
      <View style={styles.form}>
        <TextField
          label={t('member.measure.date')}
          placeholder={toDateKey(new Date())}
          value={dateKey}
          onChangeText={setDateKey}
          autoCapitalize="none"
        />
        <TextField
          label={t('member.measure.weight')}
          placeholder="75.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType={NUMERIC}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label={t('member.measure.chest')}
              placeholder="102"
              value={chest}
              onChangeText={setChest}
              keyboardType={NUMERIC}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label={t('member.measure.waist')}
              placeholder="84"
              value={waist}
              onChangeText={setWaist}
              keyboardType={NUMERIC}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label={t('member.measure.arm')}
              placeholder="38"
              value={arm}
              onChangeText={setArm}
              keyboardType={NUMERIC}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label={t('member.measure.thigh')}
              placeholder="58"
              value={thigh}
              onChangeText={setThigh}
              keyboardType={NUMERIC}
            />
          </View>
        </View>
        <TextField
          label={t('member.selfie.notes')}
          placeholder={t('member.measure.notesPlaceholder')}
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
  form: { gap: 14, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
