import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core'
import { movement_types } from './movementType'
import { muscle_groups } from './muscleGroup'
import { users } from './user'

export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  image_url: text('image_url').default(''),
  description: text('description').default(''),
  muscle_group_id: integer('muscle_group_id')
    .notNull()
    .references(() => muscle_groups.id),
  movement_type_id: integer('movement_type_id')
    .notNull()
    .references(() => movement_types.id),
  created_at: timestamp('created_at'),
  is_system_exercise: boolean('is_system_exercise'),
  user_id: uuid('user_id').references(() => users.id),
})

export type Exercise = typeof exercises.$inferSelect
export type NewExercise = typeof exercises.$inferInsert
