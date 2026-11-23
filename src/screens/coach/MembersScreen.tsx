import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, useTheme } from '../../theme';
import {
  AppText,
  Avatar,
  Badge,
  Card,
  Chip,
  EmptyState,
  ListGroup,
  ListGroupHeader,
  ListRow,
  NavBar,
  Screen,
  SearchField,
  SheetModal,
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectGymMembers, selectUserById } from '../../store/slices/membersSlice';
import { selectCompletionCountForDates } from '../../store/slices/completionsSlice';
import { addDays, toDateKey } from '../../utils/date';
import { matchesQuery } from '../../utils/search';

type SortMode = 'name' | 'activity';

/** Coach directory: members of their gym, searchable and sortable. */
export function MembersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const profile = useAppSelector((state) => state.auth.profile);
  const members = useAppSelector((state) => selectGymMembers(state, profile?.gymId));
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const last7Keys = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(today, index - 6)));
  }, []);

  const visibleMembers = useMemo(
    () => members.filter((member) => matchesQuery(query, member.name, member.email)),
    [members, query],
  );

  const completionsByUser = useAppSelector((state) => state.completions.byUser);
  const sortedMembers = useMemo(() => {
    if (sortMode === 'name') return visibleMembers;
    const countFor = (uid: string) =>
      last7Keys.reduce(
        (total, key) => total + Object.keys(completionsByUser[uid]?.[key] ?? {}).length,
        0,
      );
    return [...visibleMembers].sort((a, b) => countFor(b.uid) - countFor(a.uid));
  }, [visibleMembers, sortMode, last7Keys, completionsByUser]);

  return (
    <Screen>
      <NavBar
        large
        title={t('coach.members.title')}
        subtitle={t('coach.members.count', { count: members.length })}
      />

      <View style={styles.filters}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t('coach.members.searchPlaceholder')} />
        <View style={styles.filterRow}>
          <Chip label={t('coach.members.sortName')} selected={sortMode === 'name'} onPress={() => setSortMode('name')} />
          <Chip
            label={t('coach.members.sortActivity')}
            selected={sortMode === 'activity'}
            onPress={() => setSortMode('activity')}
          />
        </View>
      </View>

      {visibleMembers.length === 0 ? (
        <Card>
          <EmptyState
            icon="people-outline"
            title={query.length > 0 ? t('coach.members.noResults') : t('coach.members.noMembers')}
            message={
              query.length > 0
                ? t('coach.members.tryAnother')
                : t('coach.members.emptyMessage')
            }
          />
        </Card>
      ) : (
        <View>
          <ListGroupHeader label={t('coach.members.header')} />
          <ListGroup>
            {sortedMembers.map((member) => (
              <MemberRow
                key={member.uid}
                uid={member.uid}
                dateKeys={last7Keys}
                onPress={() => setSelectedUid(member.uid)}
              />
            ))}
          </ListGroup>
          <View style={styles.legendRow}>
            <AppText variant="caption1" color={colors.secondaryLabel}>
              {t('coach.members.legend')}
            </AppText>
          </View>
        </View>
      )}

      <MemberOverviewSheet
        uid={selectedUid}
        dateKeys={last7Keys}
        onClose={() => setSelectedUid(null)}
      />
    </Screen>
  );
}

function MemberRow({
  uid,
  dateKeys,
  onPress,
}: {
  uid: string;
  dateKeys: string[];
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const member = useAppSelector((state) => state.members.byUid[uid] ?? null);
  const weekCount = useAppSelector((state) =>
    selectCompletionCountForDates(state, uid, dateKeys),
  );
  if (!member) return null;
  return (
    <ListRow
      title={member.name}
      subtitle={member.email}
      leading={<Avatar name={member.name} size={40} photoUrl={member.photoData} />}
      control={
        <Badge
          label={weekCount > 0 ? t('coach.members.thisWeek', { count: weekCount }) : t('coach.members.noActivity')}
          variant={weekCount > 0 ? 'green' : 'neutral'}
        />
      }
      chevron
      onPress={onPress}
    />
  );
}

/** Read-only overview of one member using data the coach already receives. */
function MemberOverviewSheet({
  uid,
  dateKeys,
  onClose,
}: {
  uid: string | null;
  dateKeys: string[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const member = useAppSelector((state) => (uid ? selectUserById(state, uid) : undefined));
  const coachName = useAppSelector((state) =>
    member?.coachId ? state.members.byUid[member.coachId]?.name : undefined,
  );
  const gymName = useAppSelector((state) =>
    member?.gymId ? state.gyms.byId[member.gymId]?.name : undefined,
  );
  const weekCount = useAppSelector((state) =>
    uid ? selectCompletionCountForDates(state, uid, dateKeys) : 0,
  );
  const assignmentsByDate = useAppSelector((state) => state.assignments.byDate);
  const completionsByDate = useAppSelector((state) =>
    uid ? state.completions.byUser[uid] : undefined,
  );

  const assignedToday = useMemo(() => {
    if (!uid) return 0;
    const day = assignmentsByDate[toDateKey(new Date())];
    return day ? Object.values(day).filter((assignment) => assignment.memberId === uid).length : 0;
  }, [uid, assignmentsByDate]);

  const recentDays = useMemo(
    () =>
      dateKeys
        .map((key) => ({ key, count: Object.keys(completionsByDate?.[key] ?? {}).length }))
        .filter((day) => day.count > 0)
        .reverse(),
    [dateKeys, completionsByDate],
  );

  return (
    <SheetModal
      visible={uid != null}
      onClose={onClose}
      title={member?.name ?? t('coach.members.overviewTitle')}
    >
      <View style={styles.overview}>
        {member ? (
          <>
            <View style={styles.overviewHeader}>
              <Avatar name={member.name} size={52} photoUrl={member.photoData} />
              <View style={styles.overviewIdentity}>
                <AppText variant="headline">{member.name}</AppText>
                <AppText variant="footnote" color={colors.secondaryLabel}>
                  {member.email}
                </AppText>
              </View>
            </View>

            <AppText variant="footnote" color={colors.secondaryLabel} style={styles.sectionLabel}>
              {t('coach.members.overviewTitle').toUpperCase()}
            </AppText>
            <ListGroup>
              <ListRow
                title={t('coach.members.gym')}
                value={gymName ?? t('coach.members.noGym')}
              />
              <ListRow
                title={t('coach.members.coach')}
                value={coachName ?? t('coach.members.noCoach')}
              />
              <ListRow
                title={t('coach.members.email')}
                value={member.email}
              />
            </ListGroup>

            <AppText variant="footnote" color={colors.secondaryLabel} style={styles.sectionLabel}>
              {t('coach.members.progress').toUpperCase()}
            </AppText>
            <View style={styles.statRow}>
              <StatTile value={assignedToday} label={t('coach.members.assignedToday')} />
              <StatTile value={weekCount} label={t('coach.members.completedWeek')} />
            </View>

            <AppText variant="footnote" color={colors.secondaryLabel} style={styles.sectionLabel}>
              {t('coach.members.recentCompletions')}
            </AppText>
            {recentDays.length === 0 ? (
              <AppText variant="footnote" color={colors.secondaryLabel}>
                {t('coach.members.noRecentCompletions')}
              </AppText>
            ) : (
              <ListGroup>
                {recentDays.map((day) => (
                  <ListRow
                    key={day.key}
                    title={day.key}
                    value={t('coach.members.exercisesDone', { count: day.count })}
                  />
                ))}
              </ListGroup>
            )}
          </>
        ) : null}
      </View>
    </SheetModal>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.fill }]}>
      <AppText variant="title2" tabular>
        {value}
      </AppText>
      <AppText variant="caption1" color={colors.secondaryLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 10, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  legendRow: { marginHorizontal: 32, marginTop: 8 },
  overview: { gap: 10, paddingBottom: 8 },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  overviewIdentity: { flex: 1, gap: 2 },
  sectionLabel: { marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, borderRadius: radius.md, padding: 12, gap: 2 },
});
