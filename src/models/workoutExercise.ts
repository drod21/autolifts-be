import {
  pgTable,
  serial,
  integer,
  numeric,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
import { exercises } from './exercise'
import { workouts } from './workout'

export const workout_exercises = pgTable('workout_exercises', {
  id: serial('id').primaryKey(),
  workout_id: integer('workout_id')
    .notNull()
    .references(() => workouts.id),
  exercise_id: integer('exercise_id')
    .notNull()
    .references(() => exercises.id),
  sets: integer('sets').notNull(),
  reps_min: integer('reps_min'),
  reps_max: integer('reps_max').notNull(),
  rest_timer: integer('rest_timer').notNull(),
  target_weight: integer('target_weight').default(0),
  created_at: timestamp('created_at').defaultNow(),
})
