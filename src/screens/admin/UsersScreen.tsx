import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import {
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
import { selectUsersSorted } from '../../store/slices/membersSlice';
import { selectGymName } from '../../store/slices/gymsSlice';
import { UserEditModal } from '../../components/UserEditModal';
import type { Role, UserProfile } from '../../types';

type RoleFilter = 'all' | Role;

const FILTERS: Array<{ key: RoleFilter; labelKey: string }> = [
  { key: 'all', labelKey: 'admin.users.filterAll' },
  { key: 'member', labelKey: 'admin.users.filterMembers' },
  { key: 'coach', labelKey: 'admin.users.filterCoaches' },
  { key: 'admin', labelKey: 'admin.users.filterAdmins' },
];

/** Admin: every account with role/gym filters and search. */
export function UsersScreen() {
  const { t } = useTranslation();
  const users = useAppSelector(selectUsersSorted);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const counts = useMemo(
    () => ({
      admins: users.filter((user) => user.role === 'admin').length,
      coaches: users.filter((user) => user.role === 'coach').length,
      members: users.filter((user) => user.role === 'member').length,
    }),
    [users],
  );

  const visibleUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter((user) => roleFilter === 'all' || user.role === roleFilter)
      .filter(
        (user) =>
          needle.length === 0 ||
          user.name.toLowerCase().includes(needle) ||
          user.email.toLowerCase().includes(needle),
      );
  }, [users, query, roleFilter]);

  return (
    <Screen>
      <NavBar
        large
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle', counts)}
      />

      <View style={styles.filters}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t('admin.users.searchPlaceholder')} />
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <Chip
              key={filter.key}
              label={t(filter.labelKey)}
              selected={roleFilter === filter.key}
              onPress={() => setRoleFilter(filter.key)}
            />
          ))}
        </View>
      </View>

      {visibleUsers.length === 0 ? (
        <Card>
          <EmptyState
            icon="people-outline"
            title={
              query.length > 0 || roleFilter !== 'all'
                ? t('admin.users.noResults')
                : t('admin.users.noAccounts')
            }
          />
        </Card>
      ) : (
        <View>
          <ListGroupHeader label={t('admin.users.header')} />
          <ListGroup>
            {visibleUsers.map((user) => (
              <UserRow key={user.uid} uid={user.uid} onEdit={() => setEditing(user)} />
            ))}
          </ListGroup>
        </View>
      )}

      <UserEditModal visible={editing != null} onClose={() => setEditing(null)} user={editing} />
    </Screen>
  );
}

function UserRow({ uid, onEdit }: { uid: string; onEdit: () => void }) {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.members.byUid[uid] ?? null);
  const gymName = useAppSelector((state) => selectGymName(state, user?.gymId));
  if (!user) return null;
  const roleBadge =
    user.role === 'admin' ? (
      <Badge label={t('admin.roles.admin')} variant="orange" />
    ) : user.role === 'coach' ? (
      <Badge label={t('admin.roles.coach')} variant="blue" />
    ) : null;
  return (
    <ListRow
      title={user.name}
      subtitle={user.role === 'admin' ? user.email : `${user.email} · ${gymName}`}
      leading={<Avatar name={user.name} size={40} photoUrl={user.photoData} />}
      control={roleBadge}
      chevron
      onPress={onEdit}
    />
  );
}

const styles = StyleSheet.create({
  filters: { gap: 10, marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
