// import { Elysia, NotFoundError } from 'elysia'
// import {
//   CreateWorkoutInput,
//   fetchWorkoutsWithDetails,
//   fetchWorkoutWithWorkoutExercisesAndSets,
//   getWorkouts,
// } from '../services/workoutService'
// import {
//   createWorkoutExercise,
//   getWorkoutExercisesByWorkoutId,
//   getWorkoutSummary,
// } from '../services/workoutExerciseService'
// import { SessionSetInsert, WorkoutExerciseInsert } from '../drizzle/schema'
// import { TablesInsert } from '../types/supabase'
// import { supabase } from '../libs/supabase'

// export const workoutsRouter = new Elysia({ prefix: '/workouts' })
//   // Workouts Routes
//   .get('/workouts', async ({ userId, request }) => {
//     try {
//       if (!userId) {
//         return { error: 'Unauthorized' }
//       }
//       const allWorkouts = await getWorkouts(userId, true)
//       return allWorkouts
//     } catch (error) {
//       console.error('Error fetching workouts:', error)
//       return { error: 'Internal Server Error' }
//     }
//   })
//   .get('/workouts/details', async ({ userId }) => {
//     if (!userId) {
//       return { error: 'Unauthorized' }
//     }
//     const workoutsWithExercises = await fetchWorkoutsWithDetails(userId)
//     return workoutsWithExercises
//   })
//   .get('/workouts/:workoutId', async ({ params, set, userId }) => {
//     try {
//       const { workoutId } = params
//       if (!userId) {
//         set.status = 401
//         return { error: 'Unauthorized' }
//       }

//       const workout = await fetchWorkoutWithWorkoutExercisesAndSets(
//         workoutId,
//         userId,
//       )
//       return workout
//     } catch (error) {
//       if (error instanceof NotFoundError) {
//         set.status = 404
//         return { error: error.message }
//       }
//       console.error('Error fetching workout:', error)
//       set.status = 500
//       return { error: 'Internal Server Error' }
//     }
//   })
//   .post('/workouts', async ({ body, set, userId, request }) => {
//     try {
//       console.log(request.headers, userId)

//       const { workout, workoutExercises, sets } = body as {
//         workout: CreateWorkoutInput
//         workoutExercises: WorkoutExerciseInsert[]
//         sets: (SessionSetInsert & { workout_exercise_index: number })[]
//       }
//       const supabaseClient = supabase(request)
//       const { data: newWorkout, error: workoutError } = await supabaseClient
//         .from('workouts')
//         .insert({ ...workout })
//         .select()
//         .single()

//       if (workoutExercises.length && sets.length && newWorkout) {
//         const mappedExercises = workoutExercises.map((exercise) => ({
//           ...exercise,
//           workout_id: newWorkout.id,
//           exercise_id: exercise.exercise_id,
//         }))

//         const newWorkoutExercises = await supabaseClient
//           .from('workout_exercises')
//           .insert(mappedExercises as TablesInsert<'workout_exercises'>[])
//           .select()

//         if (!newWorkoutExercises.data) {
//           throw new Error('Failed to create workout exercises')
//         }
//         const mappedSets = sets.map((set) => ({
//           ...set,
//           workout_exercise_id:
//             newWorkoutExercises.data[set.workout_exercise_index].id,
//         }))

//         const newSets = await supabaseClient
//           .from('session_sets')
//           .insert(mappedSets as TablesInsert<'session_sets'>[])
//           .select()

//         return {
//           workout: newWorkout,
//           workoutExercises: newWorkoutExercises.data,
//           sets: newSets.data,
//         }
//       }

//       // const newWorkout = await createWorkoutWithWorkoutExercisesAndSets({
//       //   workoutExercises,
//       //   workout,
//       //   sets,
//       //   userId,
//       // })

//       return newWorkout
//     } catch (error) {
//       console.error('Error creating workout:', error)
//       set.status = 500
//       return { error: 'Internal Server Error' }
//     }
//   })

//   // Workout Exercises Routes
//   .get('/workouts/:workoutId/summary', async ({ params, set }) => {
//     try {
//       const { workoutId } = params
//       const parsedWorkoutId = parseInt(workoutId)

//       const workoutSummary = await getWorkoutSummary(parsedWorkoutId)
//       return workoutSummary
//     } catch (error) {
//       console.error('Error fetching workout summary:', error)
//       set.status = 500
//       return { error: 'Internal Server Error' }
//     }
//   })
//   .get('/workouts/:workoutId/exercises', async ({ params, set }) => {
//     try {
//       const { workoutId } = params

//       const workoutExercises = await getWorkoutExercisesByWorkoutId(workoutId)

//       return workoutExercises
//     } catch (error) {
//       console.error('Error fetching workout exercises:', error)
//       set.status = 500
//       return { error: 'Internal Server Error' }
//     }
//   })
//   .post('/workouts/:workoutId/exercises', async ({ params, body, set }) => {
//     try {
//       const { workoutId } = params
//       const parsedWorkoutId = parseInt(workoutId)

//       const workoutExercises = body as {
//         exercise_id?: number
//         sets?: number
//         reps_min?: number
//         reps_max?: number
//         rest_timer?: number
//         target_weight?: number
//       }[]

//       console.log(workoutExercises)
//       const savePromises: Promise<WorkoutExerciseInsert>[] = workoutExercises
//         .map((workoutExercise): Promise<WorkoutExerciseInsert> | null => {
//           const {
//             exercise_id,
//             sets,
//             reps_min,
//             reps_max,
//             rest_timer,
//             target_weight,
//           } = workoutExercise
//           if (
//             !exercise_id ||
//             !sets ||
//             !parsedWorkoutId ||
//             !parsedWorkoutId ||
//             !reps_max ||
//             !target_weight
//           ) {
//             return null
//           }

//           return createWorkoutExercise(workoutExercise as WorkoutExerciseInsert)
//         })
//         .filter(
//           (
//             workoutExercise,
//           ): workoutExercise is Promise<WorkoutExerciseInsert> =>
//             workoutExercise !== null,
//         )

//       const res = await Promise.all(savePromises)
//       return res
//     } catch (error) {
//       console.error('Error creating workout exercises:', error)
//       set.status = 500
//       return { error: 'Internal Server Error' }
//     }
//   })
