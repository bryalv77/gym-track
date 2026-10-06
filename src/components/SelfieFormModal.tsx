import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const profile = useAppSelector((state) => state.auth.profile);

  const [photoData, setPhotoData] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  // Re-initialize the form whenever it opens or its inputs change.
  const [synced1, setSynced1] = useState<unknown[]>([]);
  const deps1 = [visible, editing];
  if (deps1.some((value, index) => value !== synced1[index])) {
    setSynced1(deps1);
    if (visible) {
      setPhotoData(editing?.photoData ?? null);
      setNotes(editing?.notes ?? '');
      setError(null);
    }
  }

  if (!profile) return null;

  const handlePick = async (source: 'camera' | 'library') => {
    setPicking(true);
    setError(null);
    try {
      const dataUrl = await pickSelfieDataUrl(source);
      if (dataUrl) setPhotoData(dataUrl);
    } catch (pickError) {
      console.warn('[SelfieFormModal] pick failed', pickError);
      setError(pickError instanceof Error ? pickError.message : t('member.selfie.loadError'));
    } finally {
      setPicking(false);
    }
  };

  const handleSave = async () => {
    if (!photoData) {
      setError(t('member.selfie.needPhoto'));
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
      setError(t('member.selfie.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={editing ? t('member.selfie.editTitle') : t('member.selfie.daily')}
      footer={
        <Button
          label={editing ? t('member.selfie.saveChanges') : t('member.selfie.save')}
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
              {t('member.selfie.none')}
            </AppText>
          </View>
        )}
        <View style={styles.row}>
          <View style={styles.half}>
            <Button
              label={t('member.selfie.camera')}
              icon="camera"
              size="md"
              variant="tinted"
              onPress={() => handlePick('camera')}
              loading={picking}
            />
          </View>
          <View style={styles.half}>
            <Button
              label={t('member.selfie.library')}
              icon="images"
              size="md"
              variant="tinted"
              onPress={() => handlePick('library')}
              loading={picking}
            />
          </View>
        </View>
        <TextField
          label={t('member.selfie.notes')}
          placeholder={t('member.selfie.notesPlaceholder')}
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
