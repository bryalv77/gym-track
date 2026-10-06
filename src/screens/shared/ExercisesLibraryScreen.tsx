import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
import { metricLabel } from '../../utils/exercisePresets';
import { ExerciseFormModal } from '../../components/ExerciseFormModal';

type TypeFilter = 'all' | 'strength' | 'cardio' | 'other';

const FILTERS: TypeFilter[] = ['all', 'strength', 'cardio', 'other'];

/** Exercise library — shared by coaches and admins, with search and filters. */
export function ExercisesLibraryScreen() {
  const { t } = useTranslation();
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
        title={t('library.title')}
        subtitle={t('library.subtitle', { count: exercises.length })}
      />

      <View style={styles.filters}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t('library.search')} />
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <Chip
              key={filter}
              label={t(`library.filters.${filter}`)}
              selected={typeFilter === filter}
              onPress={() => setTypeFilter(filter)}
            />
          ))}
        </View>
      </View>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="barbell-outline"
            title={query.length > 0 || typeFilter !== 'all' ? t('library.noResults') : t('library.emptyLibrary')}
            message={
              query.length > 0 || typeFilter !== 'all'
                ? t('library.tryAnother')
                : t('library.emptyMessage')
            }
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {byType.strength.length > 0 ? (
            <TypeSection type="strength" exercises={byType.strength} onEdit={openEdit} />
          ) : null}
          {byType.cardio.length > 0 ? (
            <TypeSection type="cardio" exercises={byType.cardio} onEdit={openEdit} />
          ) : null}
          {byType.other.length > 0 ? (
            <TypeSection type="other" exercises={byType.other} onEdit={openEdit} />
          ) : null}
          <ListGroupFooter label={t('library.tapToEdit')} />
        </View>
      )}

      <Button
        label={t('library.newExercise')}
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
  type,
  exercises,
  onEdit,
}: {
  type: 'strength' | 'cardio' | 'other';
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
  const { t } = useTranslation();
  return (
    <View>
      <AppText variant="footnote" color={colors.secondaryLabel} style={styles.typeHeader}>
        {t(`library.types.${type}`).toUpperCase()}
      </AppText>
      <ListGroup>
        {exercises.map((exercise) => (
          <ListRow
            key={exercise.id}
            title={exercise.name}
            subtitle={exercise.metricFields
              .map((field) => (field.unit ? `${metricLabel(field)} (${field.unit})` : metricLabel(field)))
              .join(' · ')}
            icon={{ name: type === 'cardio' ? 'speedometer-outline' : 'barbell-outline' }}
            control={
              <View style={styles.mediaRow}>
                {exercise.imageUrl ? <Badge label={t('library.badgeImg')} variant="neutral" /> : null}
                {exercise.videoUrl ? <Badge label={t('library.badgeVideo')} variant="blue" /> : null}
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
