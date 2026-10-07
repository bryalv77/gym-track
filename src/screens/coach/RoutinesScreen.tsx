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
import { selectRoutinesSorted } from '../../store/slices/routinesSlice';
import { RoutineFormModal } from '../../components/RoutineFormModal';
import { exerciseName } from '../../utils/defaultExerciseData';
import type { Routine } from '../../types';

/** Coach: their own routines (create, edit, delete). Routines are assigned to
 *  members from the Plan tab. */
export function RoutinesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const routines = useAppSelector(selectRoutinesSorted);
  const exercisesById = useAppSelector((state) => state.exercises.byId);
  const [query, setQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return routines.filter((routine) => needle.length === 0 || routine.name.toLowerCase().includes(needle));
  }, [routines, query]);

  const openForm = (routine: Routine | null) => {
    setEditing(routine);
    setFormVisible(true);
  };

  return (
    <Screen>
      <NavBar
        large
        title={t('routines.title')}
        subtitle={t('routines.count', { count: routines.length })}
      />

      {routines.length > 0 ? (
        <View style={styles.filters}>
          <SearchField value={query} onChangeText={setQuery} placeholder={t('routines.search')} />
        </View>
      ) : null}

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="albums-outline"
            title={query.length > 0 ? t('routines.noResults') : t('routines.emptyTitle')}
            message={query.length > 0 ? t('routines.tryAnother') : t('routines.emptyMessage')}
          />
        </Card>
      ) : (
        <View>
          <ListGroup>
            {visible.map((routine) => (
              <ListRow
                key={routine.id}
                title={routine.name}
                subtitle={routine.items
                  .map((item) => {
                    const exercise = exercisesById[item.exerciseId];
                    return exercise ? exerciseName(exercise) : '—';
                  })
                  .join(' · ')}
                value={t('routines.exerciseCount', { count: routine.items.length })}
                icon={{ name: 'albums-outline', color: colors.systemIndigo }}
                chevron
                onPress={() => openForm(routine)}
              />
            ))}
          </ListGroup>
          <ListGroupFooter label={t('routines.footer')} />
        </View>
      )}

      <Button
        label={t('routines.newRoutine')}
        icon="add"
        size="md"
        onPress={() => openForm(null)}
        style={styles.addButton}
      />

      <RoutineFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        routine={editing}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: 12 },
  addButton: { marginTop: 16 },
});
