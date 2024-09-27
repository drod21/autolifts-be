import {
  pgTable,
  serial,
  integer,
  numeric,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { workout_exercises } from './workoutExercise'

export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),
  workout_exercise_id: integer('workout_exercise_id')
    .notNull()
    .references(() => workout_exercises.id),
  weight: integer('weight').notNull(),
  reps: integer('reps').notNull(),
  rpe: numeric('rpe'),
  completed: boolean('completed').default(false),
  created_at: timestamp('created_at'),
})

export type Set = typeof sets.$inferSelect
export type NewSet = typeof sets.$inferInsert
