import { db } from '../db'
import { sets } from '../models/set'
import { NotFoundError } from '../errors'
import { eq } from 'drizzle-orm'

interface CreateSetInput {
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
}

export const createSet = async (input: CreateSetInput) => {
  const {
    workout_exercise_id,
    weight,
    reps,
    rpe = null,
    completed = false,
  } = input

  const newSet = await db
    .insert(sets)
    .values({
      workout_exercise_id,
      weight: weight.toString(),
      reps,
      rpe: rpe?.toString() ?? null,
      completed,
    })
    .returning()
    .execute()

  return newSet[0]
}
