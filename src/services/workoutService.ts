import { db } from '../db'
import { workouts } from '../models/workout'

import { eq, desc } from 'drizzle-orm'
import { NotFoundError } from '../errors'
import {
  CreateSetInput,
  createSets,
  getSetsByWorkoutExerciseId,
} from './setService'
import {
  CreateWorkoutExerciseInput,
  createWorkoutExercises,
  getWorkoutExercisesByWorkoutId,
} from './workoutExerciseService'

export interface CreateWorkoutInput {
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

export const createWorkoutWithWorkoutExercisesAndSets = async (input: {
  workout: CreateWorkoutInput
  workoutExercises: CreateWorkoutExerciseInput[]
  sets: (CreateSetInput & { workout_exercise_index: number })[]
}) => {
  const { workout, workoutExercises, sets } = input

  const newWorkout = await createWorkout(workout)
  const we = workoutExercises.map((workoutExercise) => ({
    ...workoutExercise,
    workout_id: newWorkout.id,
  }))
  const newWorkoutExercises = await createWorkoutExercises(we)

  const newSets = await createSets(
    sets.map((set) => ({
      ...set,
      workout_id: newWorkout.id,
      workout_exercise_id: newWorkoutExercises[set.workout_exercise_index].id,
    })),
  )

  return {
    workout: newWorkout,
    workoutExercises: newWorkoutExercises,
    sets: newSets,
  }
}

export const fetchWorkoutWithWorkoutExercisesAndSets = async (id: number) => {
  const workout = await getWorkoutById(id)
  const workoutExercises = await getWorkoutExercisesByWorkoutId(id)
  return {
    workout,
    workoutExercises,
  }
}
