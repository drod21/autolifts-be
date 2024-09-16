import { db } from '../db'
import { cache } from '../cache'
import { NotFoundError } from '../errors'
import { asc, desc, eq } from 'drizzle-orm'
import { muscle_groups } from '../models/muscleGroup'
import { movement_types } from '../models/movementType'

export const getMuscleGroups = async () => {
  const muscleGroups = await cache.getMuscleGroups()
  return muscleGroups
}

export const getMovementTypes = async () => {
  const mt = await cache.getMovementTypes()
  return mt
}
