import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../theme';
import { AppText, Button, SheetModal, TextField } from '../ui';
import { useAppSelector } from '../store/hooks';
import { addSelfie, updateSelfie } from '../services/selfies';
import { pickSelfieDataUrl } from '../utils/photo';
import type { DailySelfie } from '../types';

/** Sheet to capture / preview / edit a daily selfie. */
export function SelfieFormModal({
  visible,
  onClose,
  dateKey,
  /** null = new selfie */
  editing,
}: {
  visible: boolean;
  onClose: () => void;
  dateKey: string;
  editing?: DailySelfie | null;
}) {
  const { colors } = useTheme();
  const profile = useAppSelector((state) => state.auth.profile);

  const [photoData, setPhotoData] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPhotoData(editing?.photoData ?? null);
    setNotes(editing?.notes ?? '');
    setError(null);
  }, [visible, editing]);

  if (!profile) return null;

  const handlePick = async (source: 'camera' | 'library') => {
    setPicking(true);
    setError(null);
    try {
      const dataUrl = await pickSelfieDataUrl(source);
      if (dataUrl) setPhotoData(dataUrl);
    } catch (pickError) {
      console.warn('[SelfieFormModal] pick failed', pickError);
      setError(pickError instanceof Error ? pickError.message : 'Could not load the photo.');
    } finally {
      setPicking(false);
    }
  };

  const handleSave = async () => {
    if (!photoData) {
      setError('Take or choose a selfie first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateSelfie(profile.uid, {
          ...editing,
          photoData,
          notes: notes.trim() || undefined,
          takenAt: Date.now(),
        });
      } else {
        await addSelfie(profile.uid, {
          dateKey,
          photoData,
          notes: notes.trim() || undefined,
          takenAt: Date.now(),
        });
      }
      onClose();
    } catch (saveError) {
      console.warn('[SelfieFormModal] save failed', saveError);
      setError('Could not save. Check your connection and rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={editing ? 'Edit Selfie' : 'Daily Selfie'}
      footer={
        <Button
          label={editing ? 'Save Changes' : 'Save Selfie'}
          onPress={handleSave}
          loading={saving}
          disabled={!photoData}
        />
      }
    >
      <View style={styles.form}>
        {photoData ? (
          <Image source={{ uri: photoData }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.preview, styles.placeholder, { backgroundColor: colors.fill }]}>
            <AppText variant="footnote" color={colors.tertiaryLabel} align="center">
              No selfie yet
            </AppText>
          </View>
        )}
        <View style={styles.row}>
          <View style={styles.half}>
            <Button
              label="Camera"
              icon="camera"
              size="md"
              variant="tinted"
              onPress={() => handlePick('camera')}
              loading={picking}
            />
          </View>
          <View style={styles.half}>
            <Button
              label="Library"
              icon="images"
              size="md"
              variant="tinted"
              onPress={() => handlePick('library')}
              loading={picking}
            />
          </View>
        </View>
        <TextField
          label="Notes (optional)"
          placeholder="How you felt today…"
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
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
