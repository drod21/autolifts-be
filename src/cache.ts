import { db } from './db'
import { muscle_groups } from './models/muscleGroup'
import { movement_types } from './models/movementType'

import { NotFoundError } from './errors'
import { asc } from 'drizzle-orm'

class Cache {
  private muscleGroups: Map<string, number> = new Map()
  private movementTypes: Map<string, number> = new Map()
  private muscleGroupValues = Array<typeof muscle_groups.$inferSelect>()
  private movementTypeValues = Array<typeof movement_types.$inferSelect>()

  async load() {
    try {
      const mgRows = await db.select().from(muscle_groups).execute()
      this.muscleGroupValues = mgRows
      this.muscleGroups.clear()
      mgRows.forEach((row) => {
        this.muscleGroups.set(row.name.toLowerCase(), row.id)
      })

      const mtRows = await db.select().from(movement_types).execute()
      this.movementTypeValues = mtRows
      this.movementTypes.clear()
      mtRows.forEach((row) => {
        this.movementTypes.set(row.name.toLowerCase(), row.id)
      })
    } catch (error) {
      console.error('Failed to load cache:', error)
    }
  }

  async getMuscleGroups(): Promise<(typeof muscle_groups.$inferSelect)[]> {
    return (
      this.muscleGroupValues ??
      (await db
        .select()
        .from(muscle_groups)
        .orderBy(asc(muscle_groups.name))
        .execute())
    )
  }

  async getMovementTypes(): Promise<(typeof movement_types.$inferSelect)[]> {
    return (
      this.movementTypeValues ??
      (await db
        .select()
        .from(movement_types)
        .orderBy(asc(movement_types.name))
        .execute())
    )
  }

  getMuscleGroupId(name: string): number | undefined {
    return this.muscleGroups.get(name.toLowerCase())
  }

  getMovementTypeId(name: string): number | undefined {
    return this.movementTypes.get(name.toLowerCase())
  }
}

export const cache = new Cache()
