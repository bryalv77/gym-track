import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(gym?.name ?? '');
    setError(null);
  }, [visible, gym]);

  const handleSave = async () => {
    if (name.trim().length === 0) {
      setError('Give the gym a name.');
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
      setError('Could not save. Check your connection and rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={gym ? 'Rename Gym' : 'New Gym'}
      footer={
        <Button
          label={gym ? 'Save Changes' : 'Create Gym'}
          onPress={handleSave}
          loading={saving}
        />
      }
    >
      <View style={styles.form}>
        <TextField
          label="Gym name"
          placeholder="e.g. Gimnasio Central"
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
