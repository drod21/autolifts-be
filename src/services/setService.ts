import { db } from '../db'
import { sets } from '../models/set'
import { NotFoundError } from '../errors'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm/sql'
import { SessionSetInsert, sessionSets } from '../drizzle/schema'

export interface CreateSetInput {
  workout_exercise_id: number
  weight: number
  reps: number
  rpe?: number | null
  completed?: boolean
}

export const getSetsByWorkoutExerciseId = async (
  workout_exercise_id: number,
) => {
  return await db
    .select()
    .from(sets)
    .where(eq(sets.workout_exercise_id, workout_exercise_id))
    .execute()
  // Start of Selection
}

export const createSets = async (input: SessionSetInsert[]) => {
  return await db.insert(sessionSets).values(input).returning().execute()
}

export const createSet = async (input: SessionSetInsert) => {
  const {
    workout_exercise_id,
    weight,
    planned_reps,
    rpe = null,
    isComplete = false,
    exercise_id,
    set_number = 1,
  } = input

  const config = {
    target: [sets.id],
    set: {
      weight: sql`EXCLUDED.weight`,
      reps: sql`EXCLUDED.reps`,
      completed: sql`EXCLUDED.completed`,
      rpe: sql`EXCLUDED.rpe`,
      // Add other fields that should be updated in case of a conflict
    },
  }

  const newSet = await db
    .insert(sessionSets)
    .values({
      workout_exercise_id,
      exercise_id,
      weight,
      planned_reps,
      rpe: rpe ?? null,
      set_number,
      isComplete,
    })
    .onConflictDoUpdate(config)
    .returning()
    .execute()

  return newSet[0]
}
