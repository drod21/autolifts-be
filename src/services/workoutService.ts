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
import { eq, desc, count, and } from 'drizzle-orm'
import { NotFoundError } from '../errors'
import { createSets } from './setService'
import {
  createWorkoutExercises,
  getWorkoutExercisesByWorkoutId,
} from './workoutExerciseService'
import { cache } from '../cache'

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

export const getWorkouts = async (
  userId: string,
  includeExerciseCount = false,
) => {
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
    .orderBy(desc(workouts.created_at))
    .where(eq(workouts.user_id, userId))
    .execute()
}
export const getWorkoutById = async (id: string, userId: string) => {
  const workout = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.user_id, userId)))
    .execute()

  if (workout.length === 0) {
    throw new NotFoundError('Workout not found')
  }
  return workout[0]
}

export const createWorkout = async (input: WorkoutInsert, userId: string) => {
  const { name, description, user_id = null } = input

  const newWorkout = await db
    .insert(workouts)
    .values({
      name,
      description,
      user_id: userId ?? user_id,
    })
    .returning()
    .execute()

  return newWorkout[0]
}

export const createWorkoutWithWorkoutExercisesAndSets = async (input: {
  workout: WorkoutInsert
  workoutExercises: WorkoutExerciseInsert[]
  sets: (SessionSetInsert & { workout_exercise_index: number })[]
  userId: string
}) => {
  // const supabaseClient = supabase(request)
  const { workout, workoutExercises, sets, userId } = input

  const newWorkout = await createWorkout(workout, userId)

  if (!newWorkout) {
    throw new Error('Failed to create workout')
  }
  const we = workoutExercises.map((workoutExercise) => ({
    ...workoutExercise,
    workout_id: newWorkout.id,
  }))
  const newWorkoutExercises = await createWorkoutExercises(we)
  const mapped = sets.map(({ id, ...set }) => ({
    ...set,
    workout_exercise_id: newWorkoutExercises[set.workout_exercise_index].id,
  }))
  const newSets = await createSets(mapped)

  return {
    workout: newWorkout,
    workoutExercises: newWorkoutExercises,
    sets: newSets,
  }
}

export const fetchWorkoutWithWorkoutExercisesAndSets = async (
  id: string,
  userId: string,
) => {
  const workout = await getWorkoutById(id, userId)
  const workoutExercises = await getWorkoutExercisesByWorkoutId(id)
  return {
    workout,
    workoutExercises,
  }
}

export const fetchWorkoutsWithWorkoutExercises = async (userId: string) => {
  const workouts = await getWorkouts(userId)
  const workoutExercisePromises = workouts.map(({ id }) =>
    getWorkoutExercisesByWorkoutId(id),
  )

  const workoutExercises = await Promise.allSettled(workoutExercisePromises)

  return {
    workouts,
    workoutExercises,
  }
}

export const fetchWorkoutsWithDetails = async (
  userId: string,
): Promise<WorkoutWithDetails[]> => {
  const muscleGroups = await cache.getMuscleGroups()
  const movementTypes = await cache.getMovementTypes()
  const result = await db
    .select({
      workout: {
        id: workouts.id,
        name: workouts.name,
        created_at: workouts.created_at,
      },
      workoutExercise: {
        id: workoutExercises.id,
        workout_id: workoutExercises.workout_id,
        exercise_id: workoutExercises.exercise_id,
        setsCount: workoutExercises.sets, // Renamed field
        rep_min: workoutExercises.rep_min,
        rep_max: workoutExercises.rep_max,
        target_weight: workoutExercises.weight,
        created_at: workoutExercises.created_at,
      },
      sessionSet: {
        id: sessionSets.id,
        workout_exercise_id: sessionSets.workout_exercise_id,
        weight: sessionSets.weight,
        reps: sessionSets.actual_reps,
        rpe: sessionSets.rpe,
        completed: sessionSets.is_complete,
        created_at: sessionSets.created_at,
      },
      exercise: {
        id: exercises.id,
        name: exercises.name,
        image_url: exercises.image_url,
        description: exercises.description,
        muscle_group_id: exercises.muscle_group_id,
        movement_type_id: exercises.movement_type_id,
        created_at: exercises.created_at,
        is_system_exercise: exercises.is_system_exercise,
        user_id: exercises.user_id,
        updated_at: exercises.updated_at,
      },
    })
    .from(workoutExercises)
    .leftJoin(workouts, eq(workoutExercises.workout_id, workouts.id))
    .leftJoin(exercises, eq(workoutExercises.exercise_id, exercises.id))
    .leftJoin(
      sessionSets,
      eq(workoutExercises.id, sessionSets.workout_exercise_id),
    )
    .where(eq(workouts.user_id, userId))
    .execute()

  let workoutWithDetails = result.map((r) => ({
    ...r.workout,
    workoutExercises: [] as WorkoutExerciseWithDetails[],
  }))

  workoutWithDetails = workoutWithDetails.filter((w) => w.id !== null)

  for (const r of result) {
    const workout = workoutWithDetails.find((w) => w.id === r.workout?.id)
    if (workout && r.workoutExercise && r.exercise) {
      workout.workoutExercises.push({
        ...r.workoutExercise,
        sessionSets: r.sessionSet
          ? [
              {
                id: r.sessionSet.id,
                exercise_id: r.workoutExercise.exercise_id,
                weight: r.sessionSet.weight,
                created_at: r.sessionSet.created_at,
                updated_at: r.sessionSet.created_at, // Assuming updated_at is the same as created_at for now
                session_id: r.workout?.id ?? null,
                workout_exercise_id: r.sessionSet.workout_exercise_id,
                set_number: 1, // Assuming this is the first set
                planned_reps: r.workoutExercise.rep_max, // Using repMax as plannedReps
                actual_reps: r.sessionSet.reps,
                rpe: r.sessionSet.rpe,
                is_complete: r.sessionSet.completed,
              },
            ]
          : [],
        exercise: r.exercise,
        sets: 0,
        rest_timer: null,
        total_reps: null,
        weight: null,
        created_at: null,
        updated_at: null,
      })
    }
  }

  return workoutWithDetails.map((workout) => ({
    ...workout,
    name: workout.name ?? '',
    id: Number(workout.id), // Convert string id to number
  }))
}
