import { db } from '../db'
import { workouts } from '../models/workout'

import { eq, desc } from 'drizzle-orm'
import { NotFoundError } from '../errors'

interface CreateWorkoutInput {
  name: string
  date: string
  program_id?: number | null
}

export const getWorkouts = async () => {
  return await db.select().from(workouts).orderBy(desc(workouts.date)).execute()
}
export const getWorkoutById = async (id: number) => {
  const workout = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id))
    .execute()
  if (workout.length === 0) {
    throw new NotFoundError('Workout not found')
  }
  return workout[0]
}

export const createWorkout = async (input: CreateWorkoutInput) => {
  const { name, date, program_id = null } = input

  const newWorkout = await db
    .insert(workouts)
    .values({
      name,
      date: new Date(date),
      program_id,
    })
    .returning()
    .execute()

  return newWorkout[0]
}
