import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

const FILTERS: Array<{ key: RoleFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'member', label: 'Members' },
  { key: 'coach', label: 'Coaches' },
  { key: 'admin', label: 'Admins' },
];

/** Admin: every account with role/gym filters and search. */
export function UsersScreen() {
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
        title="Users"
        subtitle={`${counts.members} members · ${counts.coaches} coaches · ${counts.admins} admin${counts.admins === 1 ? '' : 's'}`}
      />

      <View style={styles.filters}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search name or email" />
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
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
            title={query.length > 0 || roleFilter !== 'all' ? 'No results' : 'No accounts yet'}
          />
        </Card>
      ) : (
        <View>
          <ListGroupHeader label="All accounts — tap to edit role or gym" />
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
  const user = useAppSelector((state) => state.members.byUid[uid] ?? null);
  const gymName = useAppSelector((state) => selectGymName(state, user?.gymId));
  if (!user) return null;
  const roleBadge =
    user.role === 'admin' ? (
      <Badge label="Admin" variant="orange" />
    ) : user.role === 'coach' ? (
      <Badge label="Coach" variant="blue" />
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
