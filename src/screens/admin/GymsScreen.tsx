import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import {
  Button,
  Card,
  EmptyState,
  ListGroup,
  ListGroupFooter,
  ListRow,
  NavBar,
  Screen,
  SearchField,
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectGymsSorted } from '../../store/slices/gymsSlice';
import { selectUsersSorted } from '../../store/slices/membersSlice';
import { GymFormModal } from '../../components/GymFormModal';
import type { Gym } from '../../types';

/** Admin: manage the gyms, with search. */
export function GymsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const gyms = useAppSelector(selectGymsSorted);
  const users = useAppSelector(selectUsersSorted);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Gym | null>(null);
  const [query, setQuery] = useState('');

  const visibleGyms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return gyms.filter((gym) => needle.length === 0 || gym.name.toLowerCase().includes(needle));
  }, [gyms, query]);

  const countFor = (gymId: string) => ({
    coaches: users.filter((user) => user.gymId === gymId && user.role === 'coach').length,
    members: users.filter((user) => user.gymId === gymId && user.role === 'member').length,
  });

  return (
    <Screen>
      <NavBar
        large
        title={t('admin.gyms.title')}
        subtitle={t('admin.gyms.count', { count: gyms.length })}
      />

      <View style={styles.filters}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t('admin.gyms.searchPlaceholder')} />
      </View>

      {visibleGyms.length === 0 ? (
        <Card>
          <EmptyState
            icon="business-outline"
            title={query.length > 0 ? t('admin.gyms.noResults') : t('admin.gyms.noGyms')}
            message={
              query.length > 0
                ? t('admin.gyms.tryAnother')
                : t('admin.gyms.emptyMessage')
            }
          />
        </Card>
      ) : (
        <View>
          <ListGroup>
            {visibleGyms.map((gym) => {
              const counts = countFor(gym.id);
              return (
                <ListRow
                  key={gym.id}
                  title={gym.name}
                  subtitle={`${t('admin.gyms.coaches', { count: counts.coaches })} · ${t('admin.gyms.members', { count: counts.members })}`}
                  icon={{ name: 'business-outline', color: colors.systemTeal }}
                  chevron
                  onPress={() => {
                    setEditing(gym);
                    setFormVisible(true);
                  }}
                />
              );
            })}
          </ListGroup>
          <ListGroupFooter label={t('admin.gyms.footer')} />
        </View>
      )}

      <Button
        label={t('admin.gyms.newGym')}
        icon="add"
        size="md"
        onPress={() => {
          setEditing(null);
          setFormVisible(true);
        }}
        style={styles.addButton}
      />

      <GymFormModal visible={formVisible} onClose={() => setFormVisible(false)} gym={editing} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: 12 },
  addButton: { marginTop: 16 },
});
