import { Elysia } from 'elysia'
import { db } from '../lib/db'
import { exercises } from '../drizzle/schema'
import { auth } from '../libs/auth'
import { getExercises } from '../services/exerciseService'

export const exercisesRouter = new Elysia({ prefix: '/exercises' })
  .use(auth)
  .get(
    '/',
    async ({ query, cookie: { accessToken }, verifyAccessToken }) => {
      const user = await verifyAccessToken(accessToken.value ?? '')

      try {
        const allExercises = await getExercises(
          query.muscleGroupName ?? undefined,
          query.movementTypeName ?? undefined,
          user?.id,
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
  })
