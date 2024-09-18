import { db } from '../db'
import { sets } from '../models/set'
import { NotFoundError } from '../errors'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm/sql'

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

export const createSets = async (input: CreateSetInput[]) => {
  const transformedInput = input.map((set) => ({
    ...set,
    rpe: set.rpe !== undefined && set.rpe !== null ? set.rpe.toString() : null,
  }))
  return await db.insert(sets).values(transformedInput).returning().execute()
}

export const createSet = async (input: CreateSetInput) => {
  const {
    workout_exercise_id,
    weight,
    reps,
    rpe = null,
    completed = false,
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
    .insert(sets)
    .values({
      workout_exercise_id,
      weight,
      reps: reps,
      rpe: rpe?.toString() ?? null,
      completed: completed,
    })
    .onConflictDoUpdate(config)
    .returning()
    .execute()

  return newSet[0]
}
