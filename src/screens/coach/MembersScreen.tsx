import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
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
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectGymMembers } from '../../store/slices/membersSlice';
import { selectCompletionCountForDates } from '../../store/slices/completionsSlice';
import { addDays, toDateKey } from '../../utils/date';

type SortMode = 'name' | 'activity';

/** Coach directory: members of their gym, searchable and sortable. */
export function MembersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const profile = useAppSelector((state) => state.auth.profile);
  const members = useAppSelector((state) => selectGymMembers(state, profile?.gymId));
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('name');

  const last7Keys = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(today, index - 6)));
  }, []);

  const visibleMembers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter(
      (member) =>
        needle.length === 0 ||
        member.name.toLowerCase().includes(needle) ||
        member.email.toLowerCase().includes(needle),
    );
  }, [members, query]);

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
    </Screen>
  );
}

function MemberRow({ uid, dateKeys }: { uid: string; dateKeys: string[] }) {
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
    />
  );
}

const styles = StyleSheet.create({
  filters: { gap: 10, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  legendRow: { marginHorizontal: 32, marginTop: 8 },
});
