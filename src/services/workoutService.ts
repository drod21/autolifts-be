import { db } from '../db'
import {
  workouts,
  workoutExercises,
  sessionSets,
  exercises,
  WorkoutInsert,
  WorkoutExerciseInsert,
  SessionSet,
  SessionSetInsert,
  Exercise,
  WorkoutExercise,
} from '../drizzle/schema'
import { eq, desc, count } from 'drizzle-orm'
import { NotFoundError } from '../errors'
import { createSets } from './setService'
import {
  createWorkoutExercises,
  getWorkoutExercisesByWorkoutId,
} from './workoutExerciseService'

export interface CreateWorkoutInput {
  name: string
  date: string
  program_id?: number | null
}

// Define types
export interface WorkoutWithDetails {
  id: number
  name: string
  workoutExercises: WorkoutExerciseWithDetails[]
}

export type WorkoutExerciseWithDetails = WorkoutExercise & {
  exercise: Exercise
  sessionSets: SessionSet[]
}

export const getWorkouts = async (includeExerciseCount = false) => {
  return await db
    .select({
      name: workouts.name,
      id: workouts.id,
      description: workouts.description,
      exerciseCount: count(workoutExercises.id),
    })

    .from(workouts)
    .leftJoin(workoutExercises, eq(workouts.id, workoutExercises.workout_id))
    .groupBy(workouts.id)
    .orderBy(desc(workouts.createdAt))
    .execute()
}
export const getWorkoutById = async (id: string) => {
  const workout = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id))
    .execute()
  console.log('workout', workout)
  if (workout.length === 0) {
    throw new NotFoundError('Workout not found')
  }
  return workout[0]
}

export const createWorkout = async (input: WorkoutInsert) => {
  const { name, description, user_id = null } = input

  const newWorkout = await db
    .insert(workouts)
    .values({
      name,
      description,
      user_id,
    })
    .returning()
    .execute()

  return newWorkout[0]
}

export const createWorkoutWithWorkoutExercisesAndSets = async (input: {
  workout: WorkoutInsert
  workoutExercises: WorkoutExerciseInsert[]
  sets: (SessionSetInsert & { workout_exercise_index: number })[]
}) => {
  const { workout, workoutExercises, sets } = input

  const newWorkout = await createWorkout(workout)

  if (!newWorkout) {
    throw new Error('Failed to create workout')
  }
  const we = workoutExercises.map((workoutExercise) => ({
    ...workoutExercise,
    workout_id: newWorkout.id,
  }))
  const newWorkoutExercises = await createWorkoutExercises(we)
  console.log('aaa', newWorkoutExercises)
  const mapped = sets.map(({ id, ...set }) => ({
    ...set,
    workout_exercise_id: newWorkoutExercises[set.workout_exercise_index].id,
  }))
  console.log('bbb', mapped)
  const newSets = await createSets(mapped)

  return {
    workout: newWorkout,
    workoutExercises: newWorkoutExercises,
    sets: newSets,
  }
}

export const fetchWorkoutWithWorkoutExercisesAndSets = async (id: string) => {
  const workout = await getWorkoutById(id)
  const workoutExercises = await getWorkoutExercisesByWorkoutId(id)
  return {
    workout,
    workoutExercises,
  }
}

export const fetchWorkoutsWithWorkoutExercises = async () => {
  const workouts = await getWorkouts()
  const workoutExercisePromises = workouts.map(({ id }) =>
    getWorkoutExercisesByWorkoutId(id),
  )

  const workoutExercises = await Promise.allSettled(workoutExercisePromises)

  return {
    workouts,
    workoutExercises,
  }
}

export const fetchWorkoutsWithDetails = async (): Promise<
  WorkoutWithDetails[]
> => {
  const result = await db
    .select({
      workout: {
        id: workouts.id,
        name: workouts.name,
        createdAt: workouts.createdAt,
      },
      workoutExercise: {
        id: workoutExercises.id,
        workout_id: workoutExercises.workout_id,
        exercise_id: workoutExercises.exercise_id,
        setsCount: workoutExercises.sets, // Renamed field
        rep_min: workoutExercises.rep_min,
        rep_max: workoutExercises.rep_max,
        target_weight: workoutExercises.weight,
        created_at: workoutExercises.createdAt,
      },
      sessionSet: {
        id: sessionSets.id,
        workout_exercise_id: sessionSets.workout_exercise_id,
        weight: sessionSets.weight,
        reps: sessionSets.actual_reps,
        rpe: sessionSets.rpe,
        completed: sessionSets.isComplete,
        created_at: sessionSets.createdAt,
      },
      exercise: {
        id: exercises.id,
        name: exercises.name,
        imageUrl: exercises.imageUrl,
        description: exercises.description,
        muscleGroupId: exercises.muscleGroupId,
        movementTypeId: exercises.movementTypeId,
        createdAt: exercises.createdAt,
        isSystemExercise: exercises.isSystemExercise,
        user_id: exercises.user_id,
        updatedAt: exercises.updatedAt,
      },
    })
    .from(workoutExercises)
    .leftJoin(workouts, eq(workoutExercises.workout_id, workouts.id))
    .leftJoin(exercises, eq(workoutExercises.exercise_id, exercises.id))
    .leftJoin(
      sessionSets,
      eq(workoutExercises.id, sessionSets.workout_exercise_id),
    )
    .execute()

  let workoutWithDetails = result.map((r) => ({
    ...r.workout,
    workoutExercises: [] as WorkoutExerciseWithDetails[],
  }))

  workoutWithDetails = workoutWithDetails.filter((w) => w.id !== null)

  for (const r of result) {
    const workout = workoutWithDetails.find((w) => w.id === r.workout?.id)
    if (workout) {
      workout.workoutExercises.push({
        ...r.workoutExercise,
        sessionSets: r.sessionSet
          ? [
              {
                id: r.sessionSet.id,
                exercise_id: r.workoutExercise.exercise_id,
                weight: r.sessionSet.weight,
                createdAt: r.sessionSet.created_at,
                updatedAt: r.sessionSet.created_at, // Assuming updatedAt is the same as createdAt for now
                session_id: r.workout?.id ?? null,
                workout_exercise_id: r.sessionSet.workout_exercise_id,
                set_number: 1, // Assuming this is the first set
                planned_reps: r.workoutExercise.rep_max, // Using repMax as plannedReps
                actual_reps: r.sessionSet.reps,
                rpe: r.sessionSet.rpe,
                isComplete: r.sessionSet.completed,
              },
            ]
          : [],
        exerwcise: r.exercise,
      })
    }
  }

  return workoutWithDetails as unknown as WorkoutWithDetails[]
}
