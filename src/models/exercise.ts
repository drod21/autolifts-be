import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { movement_types } from './movementType'
import { muscle_groups } from './muscleGroup'

export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  muscle_group_id: integer('muscle_group_id')
    .notNull()
    .references(() => muscle_groups.id),
  movement_type_id: integer('movement_type_id')
    .notNull()
    .references(() => movement_types.id),
  created_at: timestamp('created_at').defaultNow(),
})
