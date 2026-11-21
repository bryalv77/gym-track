import { Hono } from 'hono';
import type { AppEnv } from '../types';
import type { SyncBatchResponse } from '../../../src/types/api';
import { getSql } from '../db/client';
import {
  mapAssignmentsToByDate,
  mapCompletionsToByDate,
  mapCompletionsToByUser,
  mapExercisesToRecord,
  mapGymsToRecord,
  mapMeasurementsToRecord,
  mapRoutinesToRecord,
  mapSelfiesToRecord,
  mapUserRow,
  mapUsersToRecord,
} from '../db/mappers';
import { requireAuth } from '../middleware/auth';

export const syncRouter = new Hono<AppEnv>();

syncRouter.use('*', requireAuth);

syncRouter.get('/', async (c) => {
  const user = c.get('user');
  const sql = getSql(c.env);

  const baseQueries = Promise.all([
    sql`SELECT * FROM assignments`,
    sql`SELECT * FROM exercises`,
    sql`SELECT * FROM gyms`,
  ]);

  if (user.role === 'admin' || user.role === 'coach') {
    if (user.role === 'coach') {
      const [
        [assignmentRows, exerciseRows, gymRows],
        userRows,
        routineRows,
        completionRows,
      ] = await Promise.all([
        baseQueries,
        sql`SELECT * FROM users`,
        sql`SELECT * FROM routines WHERE coach_id = ${user.uid}`,
        sql`SELECT * FROM completions`,
      ]);

      const batchResponse: SyncBatchResponse = {
        assignments: mapAssignmentsToByDate(assignmentRows),
        exercises: mapExercisesToRecord(exerciseRows),
        gyms: mapGymsToRecord(gymRows),
        users: mapUsersToRecord(userRows),
        routines: mapRoutinesToRecord(routineRows),
        allCompletions: mapCompletionsToByUser(completionRows),
      };
      return c.json(batchResponse);
    }

    const [[assignmentRows, exerciseRows, gymRows], userRows] = await Promise.all([
      baseQueries,
      sql`SELECT * FROM users`,
    ]);

    const batchResponse: SyncBatchResponse = {
      assignments: mapAssignmentsToByDate(assignmentRows),
      exercises: mapExercisesToRecord(exerciseRows),
      gyms: mapGymsToRecord(gymRows),
      users: mapUsersToRecord(userRows),
    };
    return c.json(batchResponse);
  }

  const [
    [assignmentRows, exerciseRows, gymRows],
    userRows,
    completionRows,
    measurementRows,
    selfieRows,
  ] = await Promise.all([
    baseQueries,
    sql`SELECT * FROM users WHERE uid = ${user.uid} LIMIT 1`,
    sql`SELECT * FROM completions WHERE uid = ${user.uid}`,
    sql`SELECT * FROM measurements WHERE uid = ${user.uid}`,
    sql`SELECT * FROM selfies WHERE uid = ${user.uid}`,
  ]);

  const userProfile = userRows.length > 0 ? mapUserRow(userRows[0]) : null;
  let coachProfile = null;

  if (userProfile?.coachId) {
    const coachRows = await sql`SELECT * FROM users WHERE uid = ${userProfile.coachId} LIMIT 1`;
    if (coachRows.length > 0) {
      coachProfile = mapUserRow(coachRows[0]);
    }
  }

  const batchResponse: SyncBatchResponse = {
    assignments: mapAssignmentsToByDate(assignmentRows),
    exercises: mapExercisesToRecord(exerciseRows),
    gyms: mapGymsToRecord(gymRows),
    userProfile,
    coachProfile,
    userCompletions: mapCompletionsToByDate(completionRows),
    measurements: mapMeasurementsToRecord(measurementRows),
    selfies: mapSelfiesToRecord(selfieRows),
  };

  return c.json(batchResponse);
});
