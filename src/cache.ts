import { db } from './db'
import { eq } from 'drizzle-orm'
import { muscle_groups } from './models/muscleGroup'
import { movement_types } from './models/movementType'

import { asc } from 'drizzle-orm'
import { exercises } from './drizzle/schema'

type Exercise = Omit<
  typeof exercises.$inferInsert,
  'muscle_group_id' | 'movement_type_id'
> & {
  muscle_group_name: string | null
  movement_type_name: string | null
}

class Cache {
  private muscleGroups: Map<string, number> = new Map()
  private movementTypes: Map<string, number> = new Map()
  private systemExercises: Map<string, Exercise> = new Map()
  private systemExerciseValues = Array<Exercise>()
  private muscleGroupValues = Array<typeof muscle_groups.$inferSelect>()
  private movementTypeValues = Array<typeof movement_types.$inferSelect>()

  getSystemExercises(): Exercise[] {
    return this.systemExerciseValues
  }

  getSystemExercise(id: string): Exercise | undefined {
    return this.systemExercises.get(id)
  }

  async load() {
    // load exercises with muscle groups and movement types
    const systemExercises = await db
      .select({
        id: exercises.id,
        description: exercises.description,
        created_at: exercises.created_at,
        updated_at: exercises.updated_at,
        image_url: exercises.image_url,
        name: exercises.name,
        muscle_group_name: muscle_groups.name,
        movement_type_name: movement_types.name,
      })
      .from(exercises)
      .leftJoin(muscle_groups, eq(exercises.muscle_group_id, muscle_groups.id))
      .leftJoin(
        movement_types,
        eq(exercises.movement_type_id, movement_types.id),
      )
      .where(eq(exercises.is_system_exercise, true))
      .execute()

    this.systemExercises.clear()
    this.systemExerciseValues = []
    systemExercises.forEach((exercise) => {
      this.systemExercises.set(exercise.id, exercise)
      this.systemExerciseValues.push(exercise)
    })

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
