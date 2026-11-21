import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../theme';
import { AppText, Button, Chip, SearchField, SheetModal } from '../ui';
import { useAppSelector } from '../store/hooks';
import { selectGymMembers } from '../store/slices/membersSlice';
import { selectRoutinesSorted } from '../store/slices/routinesSlice';
import { assignRoutine } from '../services/routines';
import { exerciseName } from '../utils/defaultExerciseData';
import { formatFullDate, parseDateKey } from '../utils/date';

/** Coach sheet to send one of their routines to one or more members for a day. */
export function AssignRoutineModal({
  visible,
  onClose,
  dateKey,
  initialMemberId,
}: {
  visible: boolean;
  onClose: () => void;
  dateKey: string;
  initialMemberId?: string | null;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const coach = useAppSelector((state) => state.auth.profile);
  const gymMembers = useAppSelector((state) =>
    selectGymMembers(state, state.auth.profile?.gymId),
  );
  const routines = useAppSelector(selectRoutinesSorted);
  const exercisesById = useAppSelector((state) => state.exercises.byId);

  const [routineId, setRoutineId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-initialize the form whenever it opens or its inputs change.
  useEffect(() => {
    if (!visible) return;
    setRoutineId(null);
    setMemberIds(initialMemberId ? [initialMemberId] : []);
    setMemberQuery('');
    setError(null);
  }, [visible, initialMemberId]);

  const visibleMembers = useMemo(() => {
    const needle = memberQuery.trim().toLowerCase();
    if (needle.length === 0) return gymMembers;
    return gymMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(needle) ||
        member.email.toLowerCase().includes(needle),
    );
  }, [gymMembers, memberQuery]);

  if (!coach) return null;

  const routine = routines.find((candidate) => candidate.id === routineId);
  const allSelected = gymMembers.length > 0 && memberIds.length === gymMembers.length;

  const toggleMember = (uid: string) =>
    setMemberIds((current) =>
      current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid],
    );

  const handleAssign = async () => {
    if (!routine) {
      setError(t('routines.assign.pickRoutine'));
      return;
    }
    if (memberIds.length === 0) {
      setError(t('routines.assign.pickMembers'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await assignRoutine({ routine, memberIds, dateKey, coachId: coach.uid });
      onClose();
    } catch (saveError) {
      console.warn('[AssignRoutineModal] assign failed', saveError);
      setError(t('coach.assign.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={t('routines.assign.title')}
      confirmDiscard
      footer={
        <View style={styles.footer}>
          {error ? (
            <AppText variant="footnote" color={colors.systemRed}>
              {error}
            </AppText>
          ) : null}
          <Button label={t('routines.assign.assign')} onPress={handleAssign} loading={saving} />
        </View>
      }
    >
      <View style={styles.form}>
        <AppText variant="footnote" color={colors.secondaryLabel}>
          {t('routines.assign.forDay', { date: formatFullDate(parseDateKey(dateKey)) })}
        </AppText>

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('routines.assign.routineHeader')}
          </AppText>
          <View style={styles.chips}>
            {routines.map((candidate) => (
              <Chip
                key={candidate.id}
                label={candidate.name}
                selected={routineId === candidate.id}
                onPress={() => setRoutineId(candidate.id)}
              />
            ))}
            {routines.length === 0 ? (
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {t('routines.assign.noRoutines')}
              </AppText>
            ) : null}
          </View>
          {routine ? (
            <View style={[styles.preview, { backgroundColor: colors.background }]}>
              {routine.items.map((item, index) => {
                const exercise = exercisesById[item.exerciseId];
                return (
                  <AppText key={index} variant="footnote" color={colors.secondaryLabel}>
                    {`${index + 1}. ${exercise ? exerciseName(exercise) : t('routines.form.missingExercise')}`}
                  </AppText>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <AppText variant="footnote" color={colors.secondaryLabel}>
            {t('routines.assign.membersHeader')}
          </AppText>
          {gymMembers.length > 6 ? (
            <SearchField
              value={memberQuery}
              onChangeText={setMemberQuery}
              placeholder={t('coach.assign.searchMembers')}
            />
          ) : null}
          {visibleMembers.length > 6 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {gymMembers.length > 1 ? (
                <Chip
                  label={t('routines.assign.everyone')}
                  selected={allSelected}
                  onPress={() => setMemberIds(allSelected ? [] : gymMembers.map((member) => member.uid))}
                />
              ) : null}
              {visibleMembers.map((member) => (
                <Chip
                  key={member.uid}
                  label={member.name}
                  selected={memberIds.includes(member.uid)}
                  onPress={() => toggleMember(member.uid)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.chips}>
              {gymMembers.length > 1 && memberQuery.trim().length === 0 ? (
                <Chip
                  label={t('routines.assign.everyone')}
                  selected={allSelected}
                  onPress={() => setMemberIds(allSelected ? [] : gymMembers.map((member) => member.uid))}
                />
              ) : null}
              {visibleMembers.map((member) => (
                <Chip
                  key={member.uid}
                  label={member.name}
                  selected={memberIds.includes(member.uid)}
                  onPress={() => toggleMember(member.uid)}
                />
              ))}
              {gymMembers.length === 0 ? (
                <AppText variant="footnote" color={colors.secondaryLabel}>
                  {t('coach.assign.noMembers')}
                </AppText>
              ) : visibleMembers.length === 0 ? (
                <AppText variant="footnote" color={colors.secondaryLabel}>
                  {t('coach.members.noResults')}
                </AppText>
              ) : null}
            </View>
          )}
        </View>

        <AppText variant="footnote" color={colors.tertiaryLabel}>
          {t('routines.assign.note')}
        </AppText>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, paddingBottom: 8 },
  section: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsScroll: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  preview: { gap: 2, borderRadius: radius.md, padding: 12 },
  footer: { gap: 10 },
});
