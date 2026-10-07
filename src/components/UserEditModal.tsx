import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { AppText, Avatar, Button, Chip, SegmentedControl, SheetModal } from '../ui';
import { useAppSelector } from '../store/hooks';
import { selectGymsSorted } from '../store/slices/gymsSlice';
import { selectGymCoaches } from '../store/slices/membersSlice';
import { updateUserProfile } from '../services/auth';
import type { Role, UserProfile } from '../types';

const ROLE_OPTIONS: Role[] = ['member', 'coach', 'admin'];
/** Admin sheet to change a user's role and gym membership. */
export function UserEditModal({
  visible,
  onClose,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const gyms = useAppSelector(selectGymsSorted);
  const [role, setRole] = useState<Role>('member');
  const [gymId, setGymId] = useState<string | undefined>(undefined);
  const [coachId, setCoachId] = useState<string | undefined>(undefined);
  const coaches = useAppSelector((state) => selectGymCoaches(state, gymId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-initialize the form whenever it opens or its inputs change.
  const [synced1, setSynced1] = useState<unknown[]>([]);
  const deps1 = [visible, user];
  if (deps1.some((value, index) => value !== synced1[index])) {
    setSynced1(deps1);
    if (visible && user) {
      setRole(user.role);
      setGymId(user.gymId);
      setCoachId(user.coachId);
      setError(null);
    }
  }

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(user.uid, {
        role,
        ...(role === 'admin' ? {} : { gymId: gymId ?? null }),
        // Only members have a coach; clear it on any other role.
        coachId: role === 'member' ? (coachId ?? null) : null,
      });
      onClose();
    } catch (saveError) {
      console.warn('[UserEditModal] save failed', saveError);
      setError(t('admin.userEdit.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={user.name}
      footer={<Button label={t('admin.userEdit.saveChanges')} onPress={handleSave} loading={saving} />}
    >
      <View style={styles.form}>
        <View style={styles.header}>
          <Avatar name={user.name} size={48} />
          <View style={{ flex: 1 }}>
            <AppText variant="headline">{user.name}</AppText>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              {user.email}
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('admin.userEdit.role')}
          </AppText>
          <SegmentedControl
            options={ROLE_OPTIONS.map((option) => t(`admin.roles.${option}`))}
            selectedIndex={ROLE_OPTIONS.indexOf(role)}
            onChange={(index) => setRole(ROLE_OPTIONS[index])}
          />
        </View>

        {role !== 'admin' ? (
          <View style={styles.section}>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              {t('admin.userEdit.gym')}
            </AppText>
            <View style={styles.chips}>
              {gyms.map((gym) => (
                <Chip
                  key={gym.id}
                  label={gym.name}
                  selected={gymId === gym.id}
                  onPress={() => setGymId(gym.id)}
                />
              ))}
              <Chip
                label={t('admin.userEdit.noGym')}
                selected={gymId == null}
                onPress={() => setGymId(undefined)}
              />
              {gyms.length === 0 ? (
                <AppText variant="footnote" color={colors.secondaryLabel}>
                  {t('admin.userEdit.noGymsYet')}
                </AppText>
              ) : null}
            </View>
          </View>
        ) : (
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('admin.userEdit.adminNote')}
          </AppText>
        )}

        {role === 'member' ? (
          <View style={styles.section}>
            <AppText variant="footnote" color={colors.secondaryLabel}>
              {t('admin.userEdit.coach')}
            </AppText>
            <View style={styles.chips}>
              {coaches.map((coach) => (
                <Chip
                  key={coach.uid}
                  label={coach.name}
                  selected={coachId === coach.uid}
                  onPress={() => setCoachId(coach.uid)}
                />
              ))}
              <Chip
                label={t('admin.userEdit.noCoach')}
                selected={coachId == null}
                onPress={() => setCoachId(undefined)}
              />
              {coaches.length === 0 ? (
                <AppText variant="footnote" color={colors.secondaryLabel}>
                  {t('admin.userEdit.noCoachesYet')}
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}

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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  section: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
