// src/router.ts

import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { db } from './db'
import { exercises } from './models/exercise'
import { programs } from './models/program'
import { workouts } from './models/workout'
import { workout_exercises } from './models/workoutExercise'
import { sets } from './models/set'
import { NotFoundError } from './errors'
import { cache } from './cache'
import {
  deleteExercise,
  getExerciseById,
  getExercises,
} from './services/exerciseService'
import { getPrograms } from './services/programService'
import { getWorkoutById, getWorkouts } from './services/workoutService'
import {
  createWorkoutExercise,
  getWorkoutExercisesByWorkoutId,
  getWorkoutSummary,
} from './services/workoutExerciseService'
import { getSetsByWorkoutExerciseId } from './services/setService'
import { getMuscleGroups, getMovementTypes } from './services/extras'

// Initialize the Elysia app
const app = new Elysia()
  .use(cors()) // Add this line to enable CORS
  .use(async (plugin) => {
    await cache.load()

    return plugin
  })

// Exercises Routes
app
  .get('/muscle-groups', async () => {
    const muscleGroups = await getMuscleGroups()
    return muscleGroups
  })
  .get('/movement-types', async () => {
    const movementTypes = await getMovementTypes()
    return movementTypes
  })
  .get('/muscle-groups-and-movement-types', async () => {
    const muscleGroups = await getMuscleGroups()
    const movementTypes = await getMovementTypes()
    return { muscleGroups, movementTypes }
  })
  .get(
    '/exercises',
    async ({ query }) => {
      try {
        const allExercises = await getExercises(
          query.muscleGroupName ?? undefined,
          query.movementTypeName ?? undefined,
        )
        return allExercises
      } catch (error) {
        console.error('Error fetching exercises:', error)
        return { error: 'Internal Server Error' }
      }
    },
    {
      query: t.Optional(
        t.Object({
          muscleGroupName: t.Optional(t.String()),
          movementTypeName: t.Optional(t.String()),
        }),
      ),
    },
  )
  .get('/exercises/:exerciseId', async ({ params, set }) => {
    const { exerciseId } = params
    const parsedExerciseId = parseInt(exerciseId)

    const exercise = await getExerciseById(parsedExerciseId)
    return exercise
  })
  .post('/exercises', async ({ body, set }) => {
    try {
      const { name, muscle_group_name, movement_type_name } = body as {
        name?: string
        muscle_group_name?: string
        movement_type_name?: string
      }

      if (!name || !muscle_group_name || !movement_type_name) {
        set.status = 400
        return { error: 'Missing required fields' }
      }

      const muscle_group_id = cache.getMuscleGroupId(muscle_group_name)
      if (!muscle_group_id) {
        throw new NotFoundError(
          `Muscle group '${muscle_group_name}' does not exist.`,
        )
      }

      const movement_type_id = cache.getMovementTypeId(movement_type_name)
      if (!movement_type_id) {
        throw new NotFoundError(
          `Movement type '${movement_type_name}' does not exist.`,
        )
      }

      const newExercise = await db
        .insert(exercises)
        .values({
          name,
          muscle_group_id,
          movement_type_id,
        })
        .returning()
        .execute()

      return newExercise[0]
    } catch (error) {
      if (error instanceof NotFoundError) {
        set.status = 404
        return { error: error.message }
      }
      console.error('Error creating exercise:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })
  .delete('/exercises/:id', async ({ params, set }) => {
    try {
      const { id } = params
      const exerciseId = parseInt(id)

      const deletedExercise = await deleteExercise(exerciseId)
      return deletedExercise
    } catch (error) {
      if (error instanceof NotFoundError) {
        set.status = 404
        return { error: error.message }
      }
      console.error('Error deleting exercise:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })

// Programs Routes
app
  .get('/programs', async () => {
    try {
      const allPrograms = await getPrograms()
      return allPrograms
    } catch (error) {
      console.error('Error fetching programs:', error)
      return { error: 'Internal Server Error' }
    }
  })
  .post('/programs', async ({ body, set }) => {
    try {
      const { name, duration_weeks, deload_week } = body as {
        name?: string
        duration_weeks?: number
        deload_week?: boolean
      }

      if (!name || !duration_weeks) {
        set.status = 400
        return { error: 'Missing required fields' }
      }

      const newProgram = await db
        .insert(programs)
        .values({
          name,
          duration_weeks,
          deload_week: deload_week ?? false,
        })
        .returning()
        .execute()

      return newProgram[0]
    } catch (error) {
      console.error('Error creating program:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })

// Workouts Routes
app
  .get('/workouts', async () => {
    try {
      const allWorkouts = await getWorkouts()
      return allWorkouts
    } catch (error) {
      console.error('Error fetching workouts:', error)
      return { error: 'Internal Server Error' }
    }
  })
  .get('/workouts/:workoutId', async ({ params, set }) => {
    try {
      const { workoutId: id } = params
      const workoutId = parseInt(id)

      const workout = await getWorkoutById(workoutId)
      return workout
    } catch (error) {
      if (error instanceof NotFoundError) {
        set.status = 404
        return { error: error.message }
      }
      console.error('Error fetching workout:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })
  .post('/workouts', async ({ body, set }) => {
    try {
      const { name, date, program_id } = body as {
        name?: string
        date?: string
        program_id?: number
      }

      if (!name || !date) {
        set.status = 400
        return { error: 'Missing required fields' }
      }

      const newWorkout = await db
        .insert(workouts)
        .values({
          name,
          date: new Date(date),
          program_id: program_id ?? null,
        })
        .returning()
        .execute()

      return newWorkout[0]
    } catch (error) {
      console.error('Error creating workout:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })

// Workout Exercises Routes
app
  .get('/workouts/:workoutId/summary', async ({ params, set }) => {
    try {
      const { workoutId } = params
      const parsedWorkoutId = parseInt(workoutId)

      const workoutSummary = await getWorkoutSummary(parsedWorkoutId)
      return workoutSummary
    } catch (error) {
      console.error('Error fetching workout summary:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })
  .get('/workouts/:workoutId/exercises', async ({ params, set }) => {
    try {
      const { workoutId } = params
      const parsedWorkoutId = parseInt(workoutId)

      const workoutExercises =
        await getWorkoutExercisesByWorkoutId(parsedWorkoutId)

      return workoutExercises
    } catch (error) {
      console.error('Error fetching workout exercises:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })
  .post('/workouts/:workoutId/exercises', async ({ params, body, set }) => {
    try {
      const { workoutId } = params
      const parsedWorkoutId = parseInt(workoutId)

      const workoutExercises = body as {
        exercise_id?: number
        sets?: number
        reps_min?: number
        reps_max?: number
        rest_timer?: number
        target_weight?: number
      }[]

      console.log(workoutExercises)
      const savePromises: Promise<typeof workout_exercises.$inferInsert>[] =
        workoutExercises
          .map(
            (
              workoutExercise,
            ): Promise<typeof workout_exercises.$inferInsert> | null => {
              const {
                exercise_id,
                sets,
                reps_min,
                reps_max,
                rest_timer,
                target_weight,
              } = workoutExercise
              if (
                !exercise_id ||
                !sets ||
                !parsedWorkoutId ||
                !parsedWorkoutId ||
                !rest_timer ||
                !reps_max ||
                !target_weight
              ) {
                return null
              }

              return createWorkoutExercise(
                workoutExercise as typeof workout_exercises.$inferInsert,
              )
            },
          )
          .filter(
            (
              workoutExercise,
            ): workoutExercise is Promise<
              typeof workout_exercises.$inferInsert
            > => workoutExercise !== null,
          )

      const res = await Promise.all(savePromises)
      return res
    } catch (error) {
      console.error('Error creating workout exercises:', error)
      set.status = 500
      return { error: 'Internal Server Error' }
    }
  })

// Sets Routes
app
  .get(
    '/workout-exercises/:workoutExerciseId/sets',
    async ({ params, set }) => {
      try {
        const { workoutExerciseId } = params
        const parsedWorkoutExerciseId = parseInt(workoutExerciseId)

        const workoutSets = await getSetsByWorkoutExerciseId(
          parsedWorkoutExerciseId,
        )

        return workoutSets
      } catch (error) {
        console.error('Error fetching sets:', error)
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    },
  )
  .post(
    '/workout-exercises/:workoutExerciseId/sets',
    async ({ params, body, set }) => {
      try {
        const { workoutExerciseId } = params
        const parsedWorkoutExerciseId = parseInt(workoutExerciseId)

        const { weight, reps, rpe, completed } = body as {
          weight?: number
          reps?: number
          rpe?: number
          completed?: boolean
        }

        if (weight === undefined || reps === undefined) {
          set.status = 400
          return { error: 'Missing required fields' }
        }

        const newSet = await db
          .insert(sets)
          .values({
            workout_exercise_id: parsedWorkoutExerciseId,
            weight: weight.toString(),
            reps,
            rpe: rpe ? rpe.toString() : null,
            completed: completed ?? false,
          })
          .returning()
          .execute()

        return newSet[0]
      } catch (error) {
        console.error('Error creating set:', error)
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    },
  )

export default app
