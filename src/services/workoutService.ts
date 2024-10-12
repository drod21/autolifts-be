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
import { eq, desc } from 'drizzle-orm'
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

export const getWorkouts = async () => {
  return await db
    .select()
    .from(workouts)
    .orderBy(desc(workouts.createdAt))
    .execute()
}
export const getWorkoutById = async (id: string) => {
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

export const createWorkout = async (input: WorkoutInsert) => {
  const { name, description, userId = null } = input

  const newWorkout = await db
    .insert(workouts)
    .values({
      name,
      description,
      userId,
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
  const we = workoutExercises.map((workoutExercise) => ({
    ...workoutExercise,
    workout_id: newWorkout.id,
  }))
  const newWorkoutExercises = await createWorkoutExercises(we)

  const newSets = await createSets(
    sets.map((set, idx) => ({
      ...set,
      setNumber: idx + 1,
      workoutExerciseId: newWorkoutExercises[set.workout_exercise_index].id,
    })),
  )

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
        workoutId: workoutExercises.workoutId,
        exerciseId: workoutExercises.exerciseId,
        setsCount: workoutExercises.sets, // Renamed field
        repMin: workoutExercises.repMin,
        repMax: workoutExercises.repMax,
        targetWeight: workoutExercises.weight,
        createdAt: workoutExercises.createdAt,
      },
      sessionSet: {
        id: sessionSets.id,
        workout_exercise_id: sessionSets.workoutExerciseId,
        weight: sessionSets.weight,
        reps: sessionSets.actualReps,
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
        userId: exercises.userId,
      },
    })
    .from(workoutExercises)
    .leftJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .leftJoin(
      sessionSets,
      eq(workoutExercises.id, sessionSets.workoutExerciseId),
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
                exerciseId: r.workoutExercise.exerciseId,
                weight: r.sessionSet.weight,
                createdAt: r.sessionSet.created_at,
                updatedAt: r.sessionSet.created_at, // Assuming updatedAt is the same as createdAt for now
                sessionId: r.workout?.id ?? null,
                workoutExerciseId: r.sessionSet.workout_exercise_id,
                setNumber: 1, // Assuming this is the first set
                plannedReps: r.workoutExercise.repMax, // Using repMax as plannedReps
                actualReps: r.sessionSet.reps,
                rpe: r.sessionSet.rpe,
                isComplete: r.sessionSet.completed,
              },
            ]
          : [],
        exercise: r.exercise ?? null,
      })
    }
  }

  return workoutWithDetails
}
