import { pgTable, serial, text } from 'drizzle-orm/pg-core'

export const muscle_groups = pgTable('muscle_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})

export type MuscleGroup = typeof muscle_groups.$inferSelect
export type NewMuscleGroup = typeof muscle_groups.$inferInsert
