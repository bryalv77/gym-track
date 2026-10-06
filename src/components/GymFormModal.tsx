import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { AppText, Button, SheetModal, TextField } from '../ui';
import { createGym, renameGym } from '../services/gyms';
import type { Gym } from '../types';

/** Admin sheet to create or rename a gym. */
export function GymFormModal({
  visible,
  onClose,
  gym,
}: {
  visible: boolean;
  onClose: () => void;
  /** null = create */
  gym: Gym | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-initialize the form whenever it opens or its inputs change.
  const [synced1, setSynced1] = useState<unknown[]>([]);
  const deps1 = [visible, gym];
  if (deps1.some((value, index) => value !== synced1[index])) {
    setSynced1(deps1);
    if (visible) {
      setName(gym?.name ?? '');
      setError(null);
    }
  }

  const handleSave = async () => {
    if (name.trim().length === 0) {
      setError(t('admin.gymForm.nameRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (gym) {
        await renameGym(gym.id, name);
      } else {
        await createGym(name);
      }
      onClose();
    } catch (saveError) {
      console.warn('[GymFormModal] save failed', saveError);
      setError(t('admin.gymForm.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={gym ? t('admin.gymForm.renameTitle') : t('admin.gymForm.newTitle')}
      footer={
        <Button
          label={gym ? t('admin.gymForm.saveChanges') : t('admin.gymForm.create')}
          onPress={handleSave}
          loading={saving}
        />
      }
    >
      <View style={styles.form}>
        <TextField
          label={t('admin.gymForm.nameLabel')}
          placeholder={t('admin.gymForm.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleSave}
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
  form: { gap: 12, paddingBottom: 8 },
});
