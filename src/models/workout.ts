import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { programs } from './program'

export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  program_id: integer('program_id').references(() => programs.id),
  created_at: timestamp('created_at').default(
    new Date(new Date().toISOString()),
  ),
})

export type Workout = typeof workouts.$inferSelect
export type NewWorkout = typeof workouts.$inferInsert
