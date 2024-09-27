import {
  boolean,
  pgTable,
  integer,
  uuid,
  numeric,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

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
  created_at: timestamp('created_at').$defaultFn(() => new Date()),
  is_system_exercise: boolean('is_system_exercise'),
  user_id: uuid('user_id').references(() => users.id),
})
export const movement_types = pgTable('movement_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})
export const muscle_groups = pgTable('muscle_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})
export const programs = pgTable('programs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  duration_weeks: integer('duration_weeks').notNull(),
  deload_week: boolean('deload_week').default(false),
  created_at: timestamp('created_at').$defaultFn(() => new Date()),
})

export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),
  workout_exercise_id: integer('workout_exercise_id')
    .notNull()
    .references(() => workout_exercises.id),
  weight: integer('weight').notNull(),
  reps: integer('reps').notNull(),
  rpe: numeric('rpe'),
  completed: boolean('completed').default(false),
  created_at: timestamp('created_at').$defaultFn(() => new Date()),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull(),
  password: text('password').notNull(),
  created_at: timestamp('created_at').$defaultFn(() => new Date()),
})

export const userTokens = pgTable('user_tokens', {
  id: uuid('id').primaryKey(),
  user_id: uuid('user_id').references(() => users.id),
  refresh_token: text('refresh_token').notNull(),
  created_at: timestamp('created_at').$defaultFn(() => new Date()),
  expires_at: timestamp('expires_at').notNull(),
})

export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  program_id: integer('program_id').references(() => programs.id),
  created_at: timestamp('created_at').$defaultFn(() => new Date()),
})

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
  target_weight: integer('target_weight').notNull(),
  created_at: timestamp('created_at'),
})

export type User = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert
export type UserToken = typeof userTokens.$inferSelect
export type UserTokenInsert = typeof userTokens.$inferInsert
export type Workout = typeof workouts.$inferSelect
export type WorkoutInsert = typeof workouts.$inferInsert
export type WorkoutExercise = typeof workout_exercises.$inferSelect
export type WorkoutExerciseInsert = typeof workout_exercises.$inferInsert
export type Set = typeof sets.$inferSelect
export type SetInsert = typeof sets.$inferInsert
export type Exercise = typeof exercises.$inferSelect
export type ExerciseInsert = typeof exercises.$inferInsert
export type MovementType = typeof movement_types.$inferSelect
export type MovementTypeInsert = typeof movement_types.$inferInsert
export type MuscleGroup = typeof muscle_groups.$inferSelect
export type MuscleGroupInsert = typeof muscle_groups.$inferInsert
export type Program = typeof programs.$inferSelect
export type ProgramInsert = typeof programs.$inferInsert
