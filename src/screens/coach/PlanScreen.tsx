import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import {
  AppText,
  Avatar,
  Button,
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
import { selectAssignmentsForDate } from '../../store/slices/assignmentsSlice';
import { selectExerciseById, formatMetrics } from '../../store/slices/exercisesSlice';
import { selectGymMembers, selectUserById } from '../../store/slices/membersSlice';
import { DatePager } from '../../components/DatePager';
import { AssignExerciseModal } from '../../components/AssignExerciseModal';
import { isToday, toDateKey } from '../../utils/date';
import type { Assignment } from '../../types';

/** Coach planner: browse a day, assign library exercises to members
 *  individually, edit the prescription or unassign. */
export function PlanScreen() {
  const { colors } = useTheme();
  const profile = useAppSelector((state) => state.auth.profile);
  const gymMembers = useAppSelector((state) =>
    selectGymMembers(state, state.auth.profile?.gymId),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [memberFilter, setMemberFilter] = useState<string | 'all'>('all');
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [presetMemberId, setPresetMemberId] = useState<string | null>(null);

  const dateKey = toDateKey(selectedDate);
  // The coach only ever sees their own gym's members' assignments.
  const gymMemberIds = useMemo(
    () => new Set(gymMembers.map((member) => member.uid)),
    [gymMembers],
  );
  const exercisesById = useAppSelector((state) => state.exercises.byId);
  const usersByUid = useAppSelector((state) => state.members.byUid);

  const assignments = useAppSelector((state) =>
    selectAssignmentsForDate(
      state,
      dateKey,
      memberFilter === 'all' ? undefined : memberFilter,
    ),
  );

  const assignmentsByDate = useAppSelector((state) => state.assignments.byDate);
  const markedDays = useMemo(
    () =>
      new Set(
        Object.entries(assignmentsByDate)
          .filter(([, day]) => Object.keys(day).length > 0)
          .map(([dayKey]) => dayKey),
      ),
    [assignmentsByDate],
  );

  const visibleAssignments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assignments
      .filter((assignment) => gymMemberIds.has(assignment.memberId))
      .filter((assignment) => {
        if (needle.length === 0) return true;
        const exerciseName = exercisesById[assignment.exerciseId]?.name.toLowerCase() ?? '';
        const memberName = usersByUid[assignment.memberId]?.name.toLowerCase() ?? '';
        return exerciseName.includes(needle) || memberName.includes(needle);
      });
  }, [assignments, query, gymMemberIds, exercisesById, usersByUid]);

  if (!profile) return null;

  const openAssign = (memberId: string | null) => {
    setEditing(null);
    setPresetMemberId(memberId);
    setModalVisible(true);
  };

  const openEdit = (assignment: Assignment) => {
    setEditing(assignment);
    setPresetMemberId(null);
    setModalVisible(true);
  };

  return (
    <Screen>
      <NavBar
        large
        title="Workout Plan"
        subtitle={isToday(selectedDate) ? 'Today' : 'Plan any day'}
      />
      <DatePager
        date={selectedDate}
        onChange={setSelectedDate}
        markedDays={markedDays}
      />

      <View style={styles.filters}>
        {gymMembers.length > 0 ? (
          <View style={styles.filterRow}>
            <Chip
              label="All members"
              selected={memberFilter === 'all'}
              onPress={() => setMemberFilter('all')}
            />
            {gymMembers.map((member) => (
              <Chip
                key={member.uid}
                label={member.name.split(' ')[0]}
                selected={memberFilter === member.uid}
                onPress={() => setMemberFilter(member.uid)}
              />
            ))}
          </View>
        ) : null}
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercise or member"
        />
      </View>

      <AppText variant="footnote" color={colors.secondaryLabel} style={styles.summary}>
        {visibleAssignments.length === 0
          ? query.length > 0
            ? 'No assignments match your search.'
            : 'No exercises assigned for this day yet.'
          : `${visibleAssignments.length} assignment${visibleAssignments.length === 1 ? '' : 's'} for this day.`}
      </AppText>

      {visibleAssignments.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={query.length > 0 ? 'No results' : 'Empty day'}
          message={
            query.length > 0
              ? 'Try another name or exercise.'
              : 'Assign an exercise to a member — they will see it instantly on their Today tab.'
          }
        />
      ) : (
        <ListGroup>
          {visibleAssignments.map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              onPress={() => openEdit(assignment)}
            />
          ))}
        </ListGroup>
      )}
      {visibleAssignments.length > 0 ? (
        <ListGroupFooter label="Tap an assignment to change the prescription or unassign it." />
      ) : null}

      <Button
        label="Assign Exercise"
        icon="add"
        size="md"
        onPress={() => openAssign(memberFilter === 'all' ? null : memberFilter)}
        style={styles.addButton}
      />

      <AssignExerciseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        dateKey={dateKey}
        assignment={editing}
        initialMemberId={presetMemberId}
      />
    </Screen>
  );
}

function AssignmentRow({
  assignment,
  onPress,
}: {
  assignment: Assignment;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const exercise = useAppSelector((state) =>
    selectExerciseById(state, assignment.exerciseId),
  );
  const member = useAppSelector((state) => selectUserById(state, assignment.memberId));
  const summary = exercise ? formatMetrics(exercise.metricFields, assignment.metrics) : '';
  const isCardio = exercise?.type === 'cardio';

  return (
    <ListRow
      title={exercise?.name ?? 'Exercise'}
      subtitle={`${member?.name ?? 'Member'} · ${summary}${assignment.notes ? `\n${assignment.notes}` : ''}`}
      icon={
        isCardio
          ? {
              name: 'speedometer-outline',
              color: colors.systemOrange,
              background: colors.orangeTint,
            }
          : { name: 'barbell-outline' }
      }
      leading={<Avatar name={member?.name ?? 'Member'} size={34} photoUrl={member?.photoData} />}
      chevron
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  filters: { gap: 10, marginBottom: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summary: { marginBottom: 12 },
  addButton: { marginTop: 16 },
});
