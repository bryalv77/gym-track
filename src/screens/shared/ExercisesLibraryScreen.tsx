import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ListGroup,
  ListGroupFooter,
  ListRow,
  NavBar,
  Screen,
  SearchField,
} from '../../ui';
import { useAppSelector } from '../../store/hooks';
import { selectExercisesSorted } from '../../store/slices/exercisesSlice';
import { ExerciseFormModal } from '../../components/ExerciseFormModal';

type TypeFilter = 'all' | 'strength' | 'cardio' | 'other';

const FILTERS: Array<{ key: TypeFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'other', label: 'General' },
];

/** Exercise library — shared by coaches and admins, with search and filters. */
export function ExercisesLibraryScreen() {
  const { colors } = useTheme();
  const exercises = useAppSelector(selectExercisesSorted);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exercises
      .filter((exercise) => typeFilter === 'all' || exercise.type === typeFilter)
      .filter((exercise) => needle.length === 0 || exercise.name.toLowerCase().includes(needle));
  }, [exercises, query, typeFilter]);

  const byType = useMemo(
    () => ({
      strength: visible.filter((exercise) => exercise.type === 'strength'),
      cardio: visible.filter((exercise) => exercise.type === 'cardio'),
      other: visible.filter((exercise) => exercise.type === 'other'),
    }),
    [visible],
  );

  return (
    <Screen>
      <NavBar
        large
        title="Exercise Library"
        subtitle={`${exercises.length} exercises with demo media`}
      />

      <View style={styles.filters}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search exercises" />
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              selected={typeFilter === filter.key}
              onPress={() => setTypeFilter(filter.key)}
            />
          ))}
        </View>
      </View>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="barbell-outline"
            title={query.length > 0 || typeFilter !== 'all' ? 'No results' : 'Empty library'}
            message={
              query.length > 0 || typeFilter !== 'all'
                ? 'Try another search or filter.'
                : "Create the gym's exercise collection. Add an image, GIF or video showing how to perform each one."
            }
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {byType.strength.length > 0 ? (
            <TypeSection label="Strength" exercises={byType.strength} onEdit={openEdit} />
          ) : null}
          {byType.cardio.length > 0 ? (
            <TypeSection label="Cardio" exercises={byType.cardio} onEdit={openEdit} />
          ) : null}
          {byType.other.length > 0 ? (
            <TypeSection label="General" exercises={byType.other} onEdit={openEdit} />
          ) : null}
          <ListGroupFooter label="Tap an exercise to edit its metrics or demo media." />
        </View>
      )}

      <Button
        label="New Exercise"
        icon="add"
        size="md"
        onPress={() => {
          setEditingId(null);
          setFormVisible(true);
        }}
        style={styles.addButton}
      />

      <ExerciseFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        exerciseId={editingId}
      />
    </Screen>
  );

  function openEdit(id: string) {
    setEditingId(id);
    setFormVisible(true);
  }
}

function TypeSection({
  label,
  exercises,
  onEdit,
}: {
  label: string;
  exercises: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    videoUrl?: string;
    metricFields: Array<{ label: string; unit: string }>;
  }>;
  onEdit: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <AppText variant="footnote" color={colors.secondaryLabel} style={styles.typeHeader}>
        {label.toUpperCase()}
      </AppText>
      <ListGroup>
        {exercises.map((exercise) => (
          <ListRow
            key={exercise.id}
            title={exercise.name}
            subtitle={exercise.metricFields
              .map((field) => (field.unit ? `${field.label} (${field.unit})` : field.label))
              .join(' · ')}
            icon={{ name: label === 'Cardio' ? 'speedometer-outline' : 'barbell-outline' }}
            control={
              <View style={styles.mediaRow}>
                {exercise.imageUrl ? <Badge label="IMG" variant="neutral" /> : null}
                {exercise.videoUrl ? <Badge label="VIDEO" variant="blue" /> : null}
              </View>
            }
            chevron
            onPress={() => onEdit(exercise.id)}
          />
        ))}
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 10, marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { gap: 4 },
  typeHeader: { marginLeft: 32, marginBottom: 7, marginTop: 8 },
  addButton: { marginTop: 16 },
  mediaRow: { flexDirection: 'row', gap: 6 },
});
