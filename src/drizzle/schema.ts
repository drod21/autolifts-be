import {
  pgTable,
  foreignKey,
  uuid,
  text,
  timestamp,
  unique,
  serial,
  index,
  varchar,
  integer,
  boolean,
  numeric,
  date,
  interval,
  jsonb,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const userTokens = pgTable(
  'user_tokens',
  {
    id: uuid('id').primaryKey().notNull(),
    userId: uuid('user_id'),
    refreshToken: text('refresh_token').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  },
  (table) => {
    return {
      userTokensUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'user_tokens_user_id_fkey',
      })
        .onUpdate('cascade')
        .onDelete('cascade'),
    }
  },
)

export const muscleGroups = pgTable(
  'muscle_groups',
  {
    id: serial('id').primaryKey().notNull(),
    name: text('name').notNull(),
  },
  (table) => {
    return {
      muscleGroupsNameKey: unique('muscle_groups_name_key').on(table.name),
    }
  },
)

export const movementTypes = pgTable(
  'movement_types',
  {
    id: serial('id').primaryKey().notNull(),
    name: text('name').notNull(),
  },
  (table) => {
    return {
      movementTypesNameKey: unique('movement_types_name_key').on(table.name),
    }
  },
)

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    password: text('password'),
  },
  (table) => {
    return {
      idxUsersEmail: index('idx_users_email').using(
        'btree',
        table.email.asc().nullsLast(),
      ),
      usersEmailKey: unique('users_email_key').on(table.email),
    }
  },
)

export const workouts = pgTable(
  'workouts',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => {
    return {
      idxWorkoutsUserId: index('idx_workouts_user_id').using(
        'btree',
        table.userId.asc().nullsLast(),
      ),
      workoutsUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'workouts_user_id_fkey',
      }).onDelete('cascade'),
    }
  },
)

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    muscleGroupId: integer('muscle_group_id'),
    movementTypeId: integer('movement_type_id'),
    isSystemExercise: boolean('is_system_exercise').default(false),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    imageUrl: text('image_url'),
  },
  (table) => {
    return {
      idxExercisesMuscleGroup: index('idx_exercises_muscle_group').using(
        'btree',
        table.muscleGroupId.asc().nullsLast(),
      ),
      idxExercisesUserId: index('idx_exercises_user_id').using(
        'btree',
        table.userId.asc().nullsLast(),
      ),
      exercisesMovementTypeIdFkey: foreignKey({
        columns: [table.movementTypeId],
        foreignColumns: [movementTypes.id],
        name: 'exercises_movement_type_id_fkey',
      }),
      exercisesMuscleGroupIdFkey: foreignKey({
        columns: [table.muscleGroupId],
        foreignColumns: [muscleGroups.id],
        name: 'exercises_muscle_group_id_fkey',
      }),
      exercisesUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'exercises_user_id_fkey',
      }).onDelete('set null'),
    }
  },
)

export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    workoutId: uuid('workout_id'),
    exerciseId: uuid('exercise_id'),
    sets: integer('sets').notNull(),
    restTimer: integer('rest_timer'),
    repMin: integer('rep_min'),
    repMax: integer('rep_max'),
    totalReps: integer('total_reps'),
    weight: numeric('weight', { precision: 10, scale: 2 }).default('0'),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => {
    return {
      idxWorkoutExercisesExerciseId: index(
        'idx_workout_exercises_exercise_id',
      ).using('btree', table.exerciseId.asc().nullsLast()),
      idxWorkoutExercisesWorkoutId: index(
        'idx_workout_exercises_workout_id',
      ).using('btree', table.workoutId.asc().nullsLast()),
      workoutExercisesExerciseIdFkey: foreignKey({
        columns: [table.exerciseId],
        foreignColumns: [exercises.id],
        name: 'workout_exercises_exercise_id_fkey',
      }).onDelete('cascade'),
      workoutExercisesWorkoutIdFkey: foreignKey({
        columns: [table.workoutId],
        foreignColumns: [workouts.id],
        name: 'workout_exercises_workout_id_fkey',
      }).onDelete('cascade'),
    }
  },
)

export const programs = pgTable(
  'programs',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id'),
    name: varchar('name', { length: 255 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    hasDeloadWeek: boolean('has_deload_week').default(false),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => {
    return {
      idxProgramsUserId: index('idx_programs_user_id').using(
        'btree',
        table.userId.asc().nullsLast(),
      ),
      programsUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'programs_user_id_fkey',
      }).onDelete('cascade'),
    }
  },
)

export const programWorkouts = pgTable(
  'program_workouts',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id'),
    workoutId: uuid('workout_id'),
    weekNumber: integer('week_number').notNull(),
    day: integer('day'),
    scheduledDate: date('scheduled_date'),
    isDeload: boolean('is_deload').default(false),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => {
    return {
      idxProgramWorkoutsProgramId: index(
        'idx_program_workouts_program_id',
      ).using('btree', table.programId.asc().nullsLast()),
      idxProgramWorkoutsScheduledDate: index(
        'idx_program_workouts_scheduled_date',
      ).using('btree', table.scheduledDate.asc().nullsLast()),
      idxProgramWorkoutsWorkoutId: index(
        'idx_program_workouts_workout_id',
      ).using('btree', table.workoutId.asc().nullsLast()),
      programWorkoutsProgramIdFkey: foreignKey({
        columns: [table.programId],
        foreignColumns: [programs.id],
        name: 'program_workouts_program_id_fkey',
      }).onDelete('cascade'),
      programWorkoutsWorkoutIdFkey: foreignKey({
        columns: [table.workoutId],
        foreignColumns: [workouts.id],
        name: 'program_workouts_workout_id_fkey',
      }).onDelete('cascade'),
    }
  },
)

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id'),
    workoutId: uuid('workout_id'),
    programId: uuid('program_id'),
    scheduledDate: date('scheduled_date'),
    actualStart: timestamp('actual_start', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    actualEnd: timestamp('actual_end', { withTimezone: true, mode: 'string' }),
    duration: interval('duration').generatedAlwaysAs(
      sql`(actual_end - actual_start)`,
    ),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => {
    return {
      idxWorkoutSessionsProgramId: index(
        'idx_workout_sessions_program_id',
      ).using('btree', table.programId.asc().nullsLast()),
      idxWorkoutSessionsUserId: index('idx_workout_sessions_user_id').using(
        'btree',
        table.userId.asc().nullsLast(),
      ),
      idxWorkoutSessionsWorkoutId: index(
        'idx_workout_sessions_workout_id',
      ).using('btree', table.workoutId.asc().nullsLast()),
      workoutSessionsProgramIdFkey: foreignKey({
        columns: [table.programId],
        foreignColumns: [programs.id],
        name: 'workout_sessions_program_id_fkey',
      }).onDelete('set null'),
      workoutSessionsUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'workout_sessions_user_id_fkey',
      }).onDelete('cascade'),
      workoutSessionsWorkoutIdFkey: foreignKey({
        columns: [table.workoutId],
        foreignColumns: [workouts.id],
        name: 'workout_sessions_workout_id_fkey',
      }).onDelete('set null'),
    }
  },
)

export const sessionSets = pgTable(
  'session_sets',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    sessionId: uuid('session_id'),
    workoutExerciseId: uuid('workout_exercise_id'),
    exerciseId: uuid('exercise_id'),
    setNumber: integer('set_number').notNull(),
    plannedReps: integer('planned_reps'),
    actualReps: integer('actual_reps'),
    weight: numeric('weight', { precision: 10, scale: 2 }),
    rpe: integer('rpe'),
    isComplete: boolean('is_complete').default(false),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => {
    return {
      idxSessionSetsExerciseId: index('idx_session_sets_exercise_id').using(
        'btree',
        table.exerciseId.asc().nullsLast(),
      ),
      idxSessionSetsSessionId: index('idx_session_sets_session_id').using(
        'btree',
        table.sessionId.asc().nullsLast(),
      ),
      sessionSetsExerciseIdFkey: foreignKey({
        columns: [table.exerciseId],
        foreignColumns: [exercises.id],
        name: 'session_sets_exercise_id_fkey',
      }).onDelete('set null'),
      sessionSetsSessionIdFkey: foreignKey({
        columns: [table.sessionId],
        foreignColumns: [workoutSessions.id],
        name: 'session_sets_session_id_fkey',
      }).onDelete('cascade'),
      sessionSetsWorkoutExerciseIdFkey: foreignKey({
        columns: [table.workoutExerciseId],
        foreignColumns: [workoutExercises.id],
        name: 'session_sets_workout_exercise_id_fkey',
      }).onDelete('set null'),
    }
  },
)

export const autoRegulationSettings = pgTable(
  'auto_regulation_settings',
  {
    id: uuid('id')
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id'),
    parameters: jsonb('parameters'),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => {
    return {
      idxAutoRegulationSettingsUserId: index(
        'idx_auto_regulation_settings_user_id',
      ).using('btree', table.userId.asc().nullsLast()),
      autoRegulationSettingsUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'auto_regulation_settings_user_id_fkey',
      }).onDelete('cascade'),
      autoRegulationSettingsUserIdKey: unique(
        'auto_regulation_settings_user_id_key',
      ).on(table.userId),
    }
  },
)

export type Exercise = typeof exercises.$inferSelect
export type ExerciseInsert = typeof exercises.$inferInsert

export type MuscleGroup = typeof muscleGroups.$inferSelect
export type MuscleGroupInsert = typeof muscleGroups.$inferInsert

export type MovementType = typeof movementTypes.$inferSelect
export type MovementTypeInsert = typeof movementTypes.$inferInsert

export type User = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert

export type UserToken = typeof userTokens.$inferSelect
export type UserTokenInsert = typeof userTokens.$inferInsert

export type Program = typeof programs.$inferSelect
export type ProgramInsert = typeof programs.$inferInsert

export type ProgramWorkout = typeof programWorkouts.$inferSelect
export type ProgramWorkoutInsert = typeof programWorkouts.$inferInsert

export type WorkoutSession = typeof workoutSessions.$inferSelect
export type WorkoutSessionInsert = typeof workoutSessions.$inferInsert

export type AutoRegulationSetting = typeof autoRegulationSettings.$inferSelect
export type AutoRegulationSettingInsert =
  typeof autoRegulationSettings.$inferInsert

export type Workout = typeof workouts.$inferSelect
export type WorkoutInsert = typeof workouts.$inferInsert

export type WorkoutExercise = typeof workoutExercises.$inferSelect
export type WorkoutExerciseInsert = typeof workoutExercises.$inferInsert

export type WorkoutExerciseWithSets = WorkoutExercise & {
  sessionSets: SessionSet[]
}

export type SessionSet = typeof sessionSets.$inferSelect
export type SessionSetInsert = typeof sessionSets.$inferInsert

export type WorkoutWithDetails = Workout & {
  workoutExercises: WorkoutExerciseWithSets[]
}

export type WorkoutExerciseWithExercise = WorkoutExercise & {
  exercise: Exercise
}

export type WorkoutExerciseWithExerciseAndSets = WorkoutExerciseWithExercise & {
  sessionSets: SessionSet[]
}

export type WorkoutSessionWithWorkoutAndExercise = WorkoutSession & {
  workout: Workout
  exercise: Exercise
}
