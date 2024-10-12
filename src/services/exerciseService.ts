import { db } from '../db'
import { exercises } from '../models/exercise'
import { cache } from '../cache'
import { NotFoundError } from '../errors'
import { and, desc, eq } from 'drizzle-orm'
import { match, P } from 'ts-pattern'
import { Sql } from 'postgres'

type CreateExerciseInput = Omit<
  typeof exercises.$inferInsert,
  'muscle_group_id' | 'movement_type_id'
> & {
  muscle_group_name: string
  movement_type_name: string
}

export const getExercises = async (
  muscleGroupName?: string,
  movementTypeName?: string,
  userId?: string,
) => {
  const ex = await db
    .select()
    .from(exercises)
    .where(
      and(
        movementTypeName && cache.getMovementTypeId(movementTypeName)
          ? eq(
              exercises.movement_type_id,
              cache.getMovementTypeId(movementTypeName)!,
            )
          : undefined,
        muscleGroupName && cache.getMuscleGroupId(muscleGroupName)
          ? eq(
              exercises.muscle_group_id,
              cache.getMuscleGroupId(muscleGroupName)!,
            )
          : undefined,
        userId ? eq(exercises.user_id, userId) : undefined,
        eq(exercises.is_system_exercise, userId ? false : true),
      ),
    )
    .orderBy(desc(exercises.created_at))

  const muscleGroups = await cache.getMuscleGroups()
  const movementTypes = await cache.getMovementTypes()

  return ex.map((e) => ({
    ...e,
    muscle_group_name: muscleGroups.find((mg) => mg.id === e.muscle_group_id)
      ?.name,
    movement_type_name: movementTypes.find((mt) => mt.id === e.movement_type_id)
      ?.name,
  }))
}

export const getExerciseById = async (id: number) => {
  const exercise = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, id))
    .execute()
  if (exercise.length === 0) {
    throw new NotFoundError('Exercise not found')
  }
  const muscleGroups = await cache.getMuscleGroups()
  const movementTypes = await cache.getMovementTypes()
  return {
    ...exercise[0],
    muscle_group_name: muscleGroups.find(
      (mg) => mg.id === exercise[0].muscle_group_id,
    )?.name,
    movement_type_name: movementTypes.find(
      (mt) => mt.id === exercise[0].movement_type_id,
    )?.name,
  }
}

export const createExercise = async (input: CreateExerciseInput) => {
  const {
    name,
    muscle_group_name,
    movement_type_name,
    image_url,
    description,
  } = input

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
    .values({ name, muscle_group_id, movement_type_id, image_url, description })
    .returning()
    .execute()

  return newExercise[0]
}

export const deleteExercise = async (id: number) => {
  await db.delete(exercises).where(eq(exercises.id, id)).execute()
  return { message: 'Exercise deleted successfully' }
}
