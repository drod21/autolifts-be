// src/router.ts

import { Context, Elysia, error, t } from 'elysia'
import { db } from './db'
import {
  WorkoutExerciseInsert,
  exercises,
  programs,
  ProgramInsert,
  SessionSetInsert,
  userTokens,
  users,
  ProgramWorkoutInsert,
} from './drizzle/schema'
import { NotFoundError } from './errors'
import { cache } from './cache'
import {
  deleteExercise,
  getExerciseById,
  getExercises,
} from './services/exerciseService'
import {
  getProgram,
  createProgram,
  createProgramWorkout,
  createProgramWorkouts,
  getPrograms,
} from './services/programService'
import {
  createWorkout,
  CreateWorkoutInput,
  createWorkoutWithWorkoutExercisesAndSets,
  fetchWorkoutsWithDetails,
  fetchWorkoutWithWorkoutExercisesAndSets,
  getWorkouts,
} from './services/workoutService'
import {
  createWorkoutExercise,
  getWorkoutExercisesByWorkoutId,
  getWorkoutSummary,
} from './services/workoutExerciseService'
import { createSet, getSetsByWorkoutExerciseId } from './services/setService'
import { getMuscleGroups, getMovementTypes } from './services/extras'
import { supabase } from './libs/supabase'
import { eq } from 'drizzle-orm'
import swagger from '@elysiajs/swagger'
import jwt from '@elysiajs/jwt'
import bearer from '@elysiajs/bearer'
import type { AuthContext } from './types/auth'
import { TablesInsert } from './types/supabase'

// Initialize the Elysia app
const router = (app: Elysia) =>
  app
    .use(
      jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET ?? '',
      }),
    )
    .use(bearer())
    .derive(async ({ cookie: { access_token, refresh_token }, request }) => {
      const supabaseClient = supabase(request)
      const { data, error } = await supabaseClient.auth.getUser()

      if (data.user)
        return {
          userId: data.user.id,
        }

      const { data: refreshed, error: refreshError } =
        await supabaseClient.auth.refreshSession({
          refresh_token: refresh_token.value ?? '',
        })

      if (refreshError) return

      return {
        userId: refreshed.user!.id,
      }
    })

    .use(
      swagger({
        documentation: {
          info: {
            title: 'Elysia Documentation',
            version: '1.0.0',
          },
          tags: [
            { name: 'App', description: 'General endpoints' },
            { name: 'Auth', description: 'Authentication endpoints' },
          ],
        },
      }),
    )

    .get(
      '/muscle-groups',
      async () => {
        const muscleGroups = await getMuscleGroups()
        return muscleGroups
      },
      { detail: { description: 'fetch muscle groups', tags: ['App'] } },
    )
    .get('/movement-types', async () => {
      const movementTypes = await getMovementTypes()
      return movementTypes
    })
    .get('/muscle-groups-and-movement-types', async () => {
      const muscleGroups = await getMuscleGroups()
      const movementTypes = await getMovementTypes()
      return { muscleGroups, movementTypes }
    })
    .group('/exercises', (app) =>
      app
        .get(
          '/',
          async ({ query, cookie: { access_token }, request }) => {
            const supabaseClient = supabase(request)
            const { data, error } = await supabaseClient.auth.getUser()

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
        .get(':exerciseId', async ({ params, set }) => {
          const { exerciseId } = params
          const parsedExerciseId = parseInt(exerciseId)

          const exercise = await getExerciseById(parsedExerciseId)
          return exercise
        })
        .post('/', async ({ body, set }) => {
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
                muscleGroupId: muscle_group_id,
                movementTypeId: movement_type_id,
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
        .delete(':id', async ({ params, set }) => {
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
        }),
    )

    // Programs Routes
    .get('/programs', async ({ userId, set }) => {
      if (!userId) {
        set.status = 401
        return { error: 'Unauthorized' }
      }

      try {
        const allPrograms = await getPrograms(userId)
        console.log(allPrograms)
        return allPrograms
      } catch (error) {
        console.error('Error fetching programs:', error)
        return { error: 'Internal Server Error' }
      }
    })
    .post('/programs', async ({ userId, body, set }) => {
      try {
        if (!userId) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        // const tokens = await db
        //   .select({
        //     user_tokens: userTokens,
        //     users: { id: users.id, name: users.name, email: users.email },
        //   })
        //   .from(userTokens)
        //   .where(eq(userTokens.refresh_token, refreshToken.value))
        //   .leftJoin(users, eq(userTokens.user_id, users.id))
        //   .limit(1)
        const {
          name,
          start_date,
          end_date,
          has_deload_week,
          duration_weeks,
          user_id,
        } = body as ProgramInsert

        if (!name || !start_date || !end_date) {
          set.status = 400
          return { error: 'Missing required fields' }
        }
        const newProgram = await createProgram({
          name,
          start_date,
          end_date,
          user_id: user_id ?? userId ?? '',
          deload_week: has_deload_week ?? false,
          duration_weeks,
        })

        return newProgram
      } catch (error) {
        console.error('Error creating program:', error)
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    })
    .get('/programs/:programId', async ({ params, set }) => {
      const { programId } = params
      // const program = await db
      //   .select()
      //   .from(programs)
      //   .where(eq(programs.id, programId))
      //   .execute()
      // return program[0]
      const program = await getProgram(programId)
      return program
    })
    .post('/programs/:programId/workouts', async ({ params, body }) => {
      const { programId } = params
      const programWorkouts = body as ProgramWorkoutInsert[]

      const newProgramWorkouts = await createProgramWorkouts(
        programWorkouts.map((workout) => ({
          ...workout,
          program_id: programId,
        })),
      )
      return newProgramWorkouts
    })

    // Workouts Routes
    .get('/workouts', async ({ userId, request }) => {
      try {
        if (!userId) {
          return { error: 'Unauthorized' }
        }
        const allWorkouts = await getWorkouts(userId, true)
        return allWorkouts
      } catch (error) {
        console.error('Error fetching workouts:', error)
        return { error: 'Internal Server Error' }
      }
    })
    .get('/workouts/details', async ({ userId }) => {
      if (!userId) {
        return { error: 'Unauthorized' }
      }
      const workoutsWithExercises = await fetchWorkoutsWithDetails(userId)
      return workoutsWithExercises
    })
    .get('/workouts/:workoutId', async ({ params, set, userId }) => {
      try {
        const { workoutId } = params
        if (!userId) {
          set.status = 401
          return { error: 'Unauthorized' }
        }

        const workout = await fetchWorkoutWithWorkoutExercisesAndSets(
          workoutId,
          userId,
        )
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
    .post('/workouts', async ({ body, set, userId, request }) => {
      try {
        console.log(request.headers, userId)

        const { workout, workoutExercises, sets } = body as {
          workout: CreateWorkoutInput
          workoutExercises: WorkoutExerciseInsert[]
          sets: (SessionSetInsert & { workout_exercise_index: number })[]
        }
        const supabaseClient = supabase(request)
        const { data: newWorkout, error: workoutError } = await supabaseClient
          .from('workouts')
          .insert({ ...workout })
          .select()
          .single()

        if (workoutExercises.length && sets.length && newWorkout) {
          const mappedExercises = workoutExercises.map((exercise) => ({
            ...exercise,
            workout_id: newWorkout.id,
            exercise_id: exercise.exercise_id,
          }))

          const newWorkoutExercises = await supabaseClient
            .from('workout_exercises')
            .insert(mappedExercises as TablesInsert<'workout_exercises'>[])
            .select()

          if (!newWorkoutExercises.data) {
            throw new Error('Failed to create workout exercises')
          }
          const mappedSets = sets.map((set) => ({
            ...set,
            workout_exercise_id:
              newWorkoutExercises.data[set.workout_exercise_index].id,
          }))

          const newSets = await supabaseClient
            .from('session_sets')
            .insert(mappedSets as TablesInsert<'session_sets'>[])
            .select()

          return {
            workout: newWorkout,
            workoutExercises: newWorkoutExercises.data,
            sets: newSets.data,
          }
        }

        // const newWorkout = await createWorkoutWithWorkoutExercisesAndSets({
        //   workoutExercises,
        //   workout,
        //   sets,
        //   userId,
        // })

        return newWorkout
      } catch (error) {
        console.error('Error creating workout:', error)
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    })

    // Workout Exercises Routes
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

        const workoutExercises = await getWorkoutExercisesByWorkoutId(workoutId)

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
        const savePromises: Promise<WorkoutExerciseInsert>[] = workoutExercises
          .map((workoutExercise): Promise<WorkoutExerciseInsert> | null => {
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
              !reps_max ||
              !target_weight
            ) {
              return null
            }

            return createWorkoutExercise(
              workoutExercise as WorkoutExerciseInsert,
            )
          })
          .filter(
            (
              workoutExercise,
            ): workoutExercise is Promise<WorkoutExerciseInsert> =>
              workoutExercise !== null,
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

          const newSet = await createSet({
            weight: weight.toString(),
            planned_reps: reps,
            rpe: rpe ?? null,
            is_complete: completed ?? false,
            workout_exercise_id: workoutExerciseId,
            set_number: 1,
          })

          return newSet
        } catch (error) {
          console.error('Error creating set:', error)
          set.status = 500
          return { error: 'Internal Server Error' }
        }
      },
    )

export default router
