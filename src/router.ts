// src/router.ts

import { Hono, Context as HonoContext } from 'hono'
import { jwt } from 'hono/jwt' // Assuming this path based on 'hono/cookie'
import { getCookie } from 'hono/cookie'
// import { swaggerUI } from 'hono/swagger-ui' // Assuming path, may need to install/verify
import { db } from './db'
import {
  WorkoutExerciseInsert,
  exercises,
  ProgramInsert,
  SessionSetInsert,
  ProgramWorkoutInsert,
  ProfileInsert,
  ExerciseInsert,
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
// import type { AuthContext } from './types/auth' // Hono will have its own way to extend context
import { TablesInsert } from './types/supabase'
import { z } from 'zod'
// Removed t from elysia, will use zod or manual validation for now
import sessionsRouter from './routes/sessions' // Import the new sessions router

// Define a type for Hono context with userId
type AppContext = HonoContext & {
  Variables: {
    userId?: string
    token?: string
  }
}

const router = new Hono<AppContext>()

// JWT Middleware
// The secret should ideally be in environment variables
const JWT_SECRET = process.env.JWT_SECRET ?? 'your-secret-key' // Fallback for local dev if not set
router.use('/api/*', jwt({ secret: JWT_SECRET, cookie: 'auth_token' })) // Example: secure all /api routes

// Bearer Token Middleware (custom)
router.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader) {
    const [type, token] = authHeader.split(' ')
    if (type === 'Bearer' && token) {
      c.set('token', token)
      // Here you might verify the bearer token if it's different from the JWT cookie
      // For now, just extracting it. If it's the same as JWT, jwt middleware handles verification.
    }
  }
  await next()
})

// Supabase User ID Middleware (replaces Elysia's .derive)
router.use('*', async (c, next) => {
  try {
    const refreshToken = getCookie(c, 'refresh_token')
    const supabaseClient = supabase(c.req.raw) // Pass the raw request for Supabase client

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(c.get('token')) // Use bearer token if available

    if (userData && userData.user) {
      c.set('userId', userData.user.id)
    } else if (refreshToken) {
      const { data: refreshed, error: refreshError } =
        await supabaseClient.auth.refreshSession({
          refresh_token: refreshToken,
        })

      if (refreshError) {
        console.warn('Failed to refresh session:', refreshError.message)
      } else if (refreshed?.user) {
        c.set('userId', refreshed.user.id)
        // Optionally set new tokens if provided in `refreshed.session`
      }
    }
  } catch (e) {
    console.error('Error in Supabase user middleware:', e)
  }
  await next()
})


// Swagger UI (placeholder, assuming hono/swagger-ui)
// router.get('/swagger', swaggerUI({ url: '/openapi.json' })) // Needs an OpenAPI spec generator
// router.get('/openapi.json', (c) => {
//   // TODO: Generate OpenAPI spec here - this is a complex task
//   // For now, returning an empty spec
//   return c.json({ openapi: '3.0.0', info: { title: 'Hono API', version: '1.0.0' }, paths: {} })
// })


// User group
const userApp = new Hono<AppContext>()
userApp.get('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const supabaseClient = supabase(c.req.raw)
  const { data, error } = await supabaseClient.auth.admin.getUserById(userId)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

userApp.post('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  // const body = await c.req.json<ProfileInsert>()
  // TODO: Add Zod validation for body
  return c.json({ userId /*, ...body */ })
})

userApp.put('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<Omit<ProfileInsert, 'user_id' | 'id'>>()
  // TODO: Add Zod validation for body like Elysia's t.Object({...})

  const supabaseClient = supabase(c.req.raw)
  const { data, error } = await supabaseClient
    .from('profiles')
    .update({
      name: body.name,
      age: body.age,
      height: body.height,
      weight: body.weight,
      goal: body.goal,
      experience_level: body.experience_level,
      workouts_per_week: body.workouts_per_week,
      starting_day: body.starting_day,
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})
router.route('/user', userApp)


// Other routes (will be converted similarly)
router.get('/muscle-groups', async (c) => {
  const muscleGroups = await getMuscleGroups()
  return c.json(muscleGroups)
})

router.get('/movement-types', async (c) => {
  const movementTypes = await getMovementTypes()
  return c.json(movementTypes)
})

router.get('/muscle-groups-and-movement-types', async (c) => {
  const muscleGroups = await getMuscleGroups()
  const movementTypes = await getMovementTypes()
  return c.json({ muscleGroups, movementTypes })
})


// Exercises group
const exercisesApp = new Hono<AppContext>()
exercisesApp.get('/', async (c) => {
  // const supabaseClient = supabase(c.req.raw) // Not used directly for auth here in original
  // const { data: userAuthData, error: authError } = await supabaseClient.auth.getUser() // Original did this
  // Not clear why auth.getUser() was called if userId isn't used directly from it here.
  // Assuming public endpoint or userId is checked by middleware if needed.
  const userId = c.get('userId') // Get the userId from context

  const muscleGroupName = c.req.query('muscleGroupName')
  const movementTypeName = c.req.query('movementTypeName')

  try {
    // Pass userId to the service function, making it optional in the service if appropriate
    const allExercises = await getExercises(muscleGroupName, movementTypeName, userId)
    return c.json(allExercises)
  } catch (err) {
    console.error('Error fetching exercises:', err)
    // Assuming err is an Error instance
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

exercisesApp.get('/:exerciseId', async (c) => {
  const exerciseIdStr = c.req.param('exerciseId')
  const parsedExerciseId = parseInt(exerciseIdStr)

  if (isNaN(parsedExerciseId)) {
    return c.json({ error: 'Invalid exercise ID' }, 400)
  }
  const exercise = await getExerciseById(parsedExerciseId)
  if (!exercise) {
    return c.json({ error: 'Exercise not found' }, 404)
  }
  return c.json(exercise)
})

exercisesApp.post('/', async (c) => {
  try {
    const body = await c.req.json<ExerciseInsert>()
    const { name, muscle_group_name, movement_type_name } = body

    if (!name || !muscle_group_name || !movement_type_name) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const muscle_group_id = cache.getMuscleGroupId(muscle_group_name)
    if (!muscle_group_id) {
      throw new NotFoundError(`Muscle group '${muscle_group_name}' does not exist.`)
    }

    const movement_type_id = cache.getMovementTypeId(movement_type_name)
    if (!movement_type_id) {
      throw new NotFoundError(`Movement type '${movement_type_name}' does not exist.`)
    }

    // Ensure user_id is not part of the insert if your table auto-generates or links it via auth
    const newExerciseValues: Omit<ExerciseInsert, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_public' | 'description' | 'video_url'> & { user_id?: string | null } = {
      name,
      muscle_group_id,
      movement_type_id,
      // user_id: c.get('userId') || null, // Example: associate with user if applicable
    };


    const newExercise = await db
      .insert(exercises)
      .values(newExerciseValues as any) // Cast to any if type conflicts with schema strictness
      .returning()
      .execute()

    return c.json(newExercise[0], 201)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, 404)
    }
    console.error('Error creating exercise:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

exercisesApp.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const exerciseId = parseInt(id)
    if (isNaN(exerciseId)) {
      return c.json({ error: 'Invalid exercise ID' }, 400)
    }

    const deletedExercise = await deleteExercise(exerciseId) // Assumes deleteExercise handles not found cases
    return c.json(deletedExercise)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, 404)
    }
    console.error('Error deleting exercise:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})
router.route('/exercises', exercisesApp)

// Programs group
const programsApp = new Hono<AppContext>()

programsApp.get('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const allPrograms = await getPrograms(userId)
    // console.log(allPrograms) // Original log
    return c.json(allPrograms)
  } catch (error) {
    console.error('Error fetching programs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

programsApp.post('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json<ProgramInsert>()
    const {
      name,
      start_date,
      end_date,
      has_deload_week, // original schema used this name
      duration_weeks,
      user_id, // original schema allowed this
    } = body

    if (!name || !start_date || !end_date) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    const newProgram = await createProgram({
      name,
      start_date,
      end_date,
      user_id: user_id ?? userId ?? '', // Prioritize body's user_id, then context's, then empty string
      deload_week: has_deload_week ?? false, // Adapted from original
      duration_weeks,
    })

    return c.json(newProgram, 201)
  } catch (error) {
    console.error('Error creating program:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

programsApp.get('/:programId', async (c) => {
  const programId = c.req.param('programId')
  // Original code had commented out direct DB access here too
  const program = await getProgram(programId)
  if (!program) {
    return c.json({ error: 'Program not found' }, 404)
  }
  return c.json(program)
})

programsApp.post('/:programId/workouts', async (c) => {
  const programId = c.req.param('programId')
  const programWorkouts = await c.req.json<ProgramWorkoutInsert[]>()

  // TODO: Add Zod validation for programWorkouts array and its items with @hono/zod-validator

  const newProgramWorkouts = await createProgramWorkouts(
    programWorkouts.map((workout) => ({
      ...workout,
      program_id: programId,
    })),
  )
  return c.json(newProgramWorkouts, 201)
})
router.route('/programs', programsApp)

// Workouts group
const workoutsApp = new Hono<AppContext>()

workoutsApp.get('/', async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const allWorkouts = await getWorkouts(userId, true)
    return c.json(allWorkouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

workoutsApp.get('/details', async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const workoutsWithExercises = await fetchWorkoutsWithDetails(userId)
  return c.json(workoutsWithExercises)
})

workoutsApp.get('/:workoutId', async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const workoutId = c.req.param('workoutId')
    const workout = await fetchWorkoutWithWorkoutExercisesAndSets(workoutId, userId)
    return c.json(workout) // Service likely handles not found by returning null/error
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, 404)
    }
    console.error('Error fetching workout:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

workoutsApp.post('', async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    // Original log: console.log(c.req.header(), userId)
    const body = await c.req.json() as {
      workout: CreateWorkoutInput
      workoutExercises: WorkoutExerciseInsert[]
      sets: (SessionSetInsert & { workout_exercise_index: number })[]
    }

    const { workout, workoutExercises, sets } = body
    const supabaseClient = supabase(c.req.raw) // Pass raw request

    // TODO: Add Zod validation for the complex body structure with @hono/zod-validator

    const { data: newWorkout, error: workoutError } = await supabaseClient
      .from('workouts')
      .insert({ ...workout, user_id: userId }) // Ensure userId is set
      .select()
      .single()

    if (workoutError) throw workoutError

    if (workoutExercises && workoutExercises.length && sets && sets.length && newWorkout) {
      const mappedExercises = workoutExercises.map((exercise) => ({
        ...exercise,
        workout_id: newWorkout.id,
        exercise_id: exercise.exercise_id,
      }))

      const { data: newWorkoutExercises, error: exercisesError } = await supabaseClient
        .from('workout_exercises')
        .insert(mappedExercises as TablesInsert<'workout_exercises'>[])
        .select()

      if (exercisesError) throw exercisesError
      if (!newWorkoutExercises) throw new Error('Failed to create workout exercises, no data returned.')


      const mappedSets = sets.map((set) => ({
        ...set,
        // Ensure id is not passed if it's auto-generated, and other fields are correct
        session_id: set.session_id || null, // Example: ensure optional fields are handled
        workout_exercise_id: newWorkoutExercises[set.workout_exercise_index].id,
      }))

      const { data: newSets, error: setsError } = await supabaseClient
        .from('session_sets')
        .insert(mappedSets as TablesInsert<'session_sets'>[])
        .select()

      if (setsError) throw setsError

      return c.json({
        workout: newWorkout,
        workoutExercises: newWorkoutExercises,
        sets: newSets,
      }, 201)
    }
    // Fallback if workoutExercises or sets are empty, just return the created workout
    return c.json(newWorkout, 201)
  } catch (error) {
    console.error('Error creating workout:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

// Workout Exercises Routes (originally nested under /workouts/:workoutId/exercises)
workoutsApp.get('/:workoutId/summary', async (c) => {
  try {
    const workoutId = c.req.param('workoutId')
    const parsedWorkoutId = parseInt(workoutId)
    if (isNaN(parsedWorkoutId)) return c.json({ error: 'Invalid workout ID' }, 400)

    const workoutSummary = await getWorkoutSummary(parsedWorkoutId)
    return c.json(workoutSummary)
  } catch (error) {
    console.error('Error fetching workout summary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

workoutsApp.get('/:workoutId/exercises', async (c) => {
  try {
    const workoutId = c.req.param('workoutId')
    // No parsing to int needed if service function handles string ID
    const workoutExercises = await getWorkoutExercisesByWorkoutId(workoutId)
    return c.json(workoutExercises)
  } catch (error) {
    console.error('Error fetching workout exercises:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

workoutsApp.post('/:workoutId/exercises', async (c) => {
  try {
    const workoutId = c.req.param('workoutId')
    const parsedWorkoutId = parseInt(workoutId) // Original used this
    if (isNaN(parsedWorkoutId)) return c.json({ error: 'Invalid workout ID' }, 400)

    const workoutExercisesPayload = await c.req.json<WorkoutExerciseInsert[]>() // Assuming array of exercises

    // TODO: Add Zod validation for workoutExercisesPayload with @hono/zod-validator

    const savePromises = workoutExercisesPayload
      .map((workoutExercise) => {
        const { exercise_id, sets, reps_max, target_weight } = workoutExercise
        // Original had a check for undefined on these, ensure service handles or validate here
        if (!exercise_id || !sets || !reps_max || !target_weight) { // Basic check
          // Consider throwing an error or collecting problematic entries
          console.warn('Skipping workout exercise due to missing fields:', workoutExercise)
          return null
        }
        // Ensure workout_id is added, original code relied on parsedWorkoutId from param
        return createWorkoutExercise({ ...workoutExercise, workout_id: workoutId })
      })
      .filter((promise): promise is Promise<WorkoutExerciseInsert> => promise !== null)

    const res = await Promise.all(savePromises)
    return c.json(res, 201)
  } catch (error) {
    console.error('Error creating workout exercises:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

workoutsApp.get('/generate', async (c) => {
  const userId = c.get('userId') // Ensure user is authenticated
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set')
    return c.json({ error: 'AI service not configured' }, 500)
  }

  // Supabase client for user profile (if needed for prompt, original didn't fetch specific profile for prompt)
  // const supabaseClient = supabase(c.req.raw)
  // const { data: userProfileData, error: profileError } = await supabaseClient
  //   .from('profiles')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .single()
  // if (profileError || !userProfileData) {
  //   return c.json({ error: 'User profile not found or error fetching it.' }, 404)
  // }

  // Using static userProfile as in original for now
  const userProfile = {
    firstName: 'John', // Replace with actual data if available
    lastName: 'Doe',
    age: 25, // userProfileData.age,
    height: 180, // userProfileData.height,
    weight: 70, // userProfileData.weight,
    goal: 'Build muscle and strength', // userProfileData.goal,
    experienceLevel: 'Beginner', // userProfileData.experience_level,
    workoutsPerWeek: 3, // userProfileData.workouts_per_week,
    startingDay: 'Monday', // userProfileData.starting_day,
  }

  const prompt = `Generate a 4-week workout plan for a user with the following characteristics:
- Name: ${userProfile.firstName} ${userProfile.lastName}
- Age: ${userProfile.age}
- Height: ${userProfile.height} inches
- Weight: ${userProfile.weight} lbs
- Training Goal: ${userProfile.goal}
- Experience Level: ${userProfile.experienceLevel}
- Workouts per Week: ${userProfile.workoutsPerWeek}
- Starting Day: ${userProfile.startingDay}

The plan should incorporate progressive overload through auto-regulation and periodization. The 4th week should be a deload week with reduced intensity and volume.

The plan should be structured as follows:

Week 1:
[Day of the week]:
- Exercise 1: [Exercise Name] - [Sets] sets of [Reps] reps
- Exercise 2: [Exercise Name] - [Sets] sets of [Reps] reps
...`

  try {
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        prompt,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      const errorBody = await response.text()
      console.error('OpenAI error body:', errorBody)
      return c.json({ error: 'Failed to generate response from AI service', details: errorBody }, response.status)
    }

    type OpenAIResponse = { choices: Array<{ text: string }> }
    const data: OpenAIResponse = await response.json()
    return c.json({ response: data.choices[0].text })
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: 'Failed to connect to AI service', details: errorMessage }, 500)
  }
})
router.route('/workouts', workoutsApp)


// Sets Routes (Standalone group as per original structure)
const setsApp = new Hono<AppContext>()

setsApp.get('/workout-exercises/:workoutExerciseId/sets', async (c) => {
  const workoutExerciseId = c.req.param('workoutExerciseId')
  // const parsedWorkoutExerciseId = parseInt(workoutExerciseId) // Service might take string or number
  // if (isNaN(parsedWorkoutExerciseId)) return c.json({ error: 'Invalid workout exercise ID' }, 400)

  // Assuming userId might be needed for authorization by the service, though not explicitly in original route handler
  // const userId = c.get('userId')
  // if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const workoutSets = await getSetsByWorkoutExerciseId(workoutExerciseId) // Pass ID as string or number as per service
    return c.json(workoutSets)
  } catch (error) {
    console.error('Error fetching sets:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})

setsApp.post('/workout-exercises/:workoutExerciseId/sets', async (c) => {
  const workoutExerciseId = c.req.param('workoutExerciseId')
  // const userId = c.get('userId') // For authorization or ownership, if needed
  // if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const body = await c.req.json<{ // Define expected body structure
      weight?: number
      reps?: number // Assuming this is planned_reps from original
      rpe?: number
      is_complete?: boolean // completed in original was is_complete in service
      set_number?: number // service needs set_number
    }>()

    // TODO: Add Zod validation for body with @hono/zod-validator

    const { weight, reps, rpe, is_complete, set_number } = body

    if (weight === undefined || reps === undefined || set_number === undefined) { // set_number is crucial for ordering
      return c.json({ error: 'Missing required fields: weight, reps, set_number' }, 400)
    }

    const newSet = await createSet({
      weight: weight.toString(), // Service expects string for weight
      planned_reps: reps,
      rpe: rpe ?? null,
      is_complete: is_complete ?? false,
      workout_exercise_id: workoutExerciseId, // Ensure this is correctly passed
      set_number: set_number,
      // actual_reps, session_id might be other fields if applicable
    })

    return c.json(newSet, 201)
  } catch (error) {
    console.error('Error creating set:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: errorMessage }, 500)
  }
})
// Mount setsApp. Since its paths are absolute, it doesn't need a base path via router.route().
// Instead, we merge it if Hono supports that, or ensure paths are unique and register directly on `router`.
// For simplicity and clarity with Hono, let's ensure paths are distinct and mount on main router.
// The original Elysia code mounted these at the root level after groups.
router.get('/workout-exercises/:workoutExerciseId/sets', setsApp.routes()[0].handler)
router.post('/workout-exercises/:workoutExerciseId/sets', setsApp.routes()[1].handler)

// Mount other routers
router.route('/sessions', sessionsRouter)


export default router
