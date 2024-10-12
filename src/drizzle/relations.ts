import { relations } from 'drizzle-orm/relations'
import {
  users,
  userTokens,
  workouts,
  movementTypes,
  exercises,
  muscleGroups,
  workoutExercises,
  programs,
  programWorkouts,
  workoutSessions,
  sessionSets,
  autoRegulationSettings,
} from './schema'

export const userTokensRelations = relations(userTokens, ({ one }) => ({
  user: one(users, {
    fields: [userTokens.userId],
    references: [users.id],
  }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  userTokens: many(userTokens),
  workouts: many(workouts),
  exercises: many(exercises),
  programs: many(programs),
  workoutSessions: many(workoutSessions),
  autoRegulationSettings: many(autoRegulationSettings),
}))

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
  programWorkouts: many(programWorkouts),
  workoutSessions: many(workoutSessions),
}))

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  movementType: one(movementTypes, {
    fields: [exercises.movementTypeId],
    references: [movementTypes.id],
  }),
  muscleGroup: one(muscleGroups, {
    fields: [exercises.muscleGroupId],
    references: [muscleGroups.id],
  }),
  user: one(users, {
    fields: [exercises.userId],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
  sessionSets: many(sessionSets),
}))

export const movementTypesRelations = relations(movementTypes, ({ many }) => ({
  exercises: many(exercises),
}))

export const muscleGroupsRelations = relations(muscleGroups, ({ many }) => ({
  exercises: many(exercises),
}))

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    sessionSets: many(sessionSets),
  }),
)

export const programsRelations = relations(programs, ({ one, many }) => ({
  user: one(users, {
    fields: [programs.userId],
    references: [users.id],
  }),
  programWorkouts: many(programWorkouts),
  workoutSessions: many(workoutSessions),
}))

export const programWorkoutsRelations = relations(
  programWorkouts,
  ({ one }) => ({
    program: one(programs, {
      fields: [programWorkouts.programId],
      references: [programs.id],
    }),
    workout: one(workouts, {
      fields: [programWorkouts.workoutId],
      references: [workouts.id],
    }),
  }),
)

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    program: one(programs, {
      fields: [workoutSessions.programId],
      references: [programs.id],
    }),
    user: one(users, {
      fields: [workoutSessions.userId],
      references: [users.id],
    }),
    workout: one(workouts, {
      fields: [workoutSessions.workoutId],
      references: [workouts.id],
    }),
    sessionSets: many(sessionSets),
  }),
)

export const sessionSetsRelations = relations(sessionSets, ({ one }) => ({
  exercise: one(exercises, {
    fields: [sessionSets.exerciseId],
    references: [exercises.id],
  }),
  workoutSession: one(workoutSessions, {
    fields: [sessionSets.sessionId],
    references: [workoutSessions.id],
  }),
  workoutExercise: one(workoutExercises, {
    fields: [sessionSets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}))

export const autoRegulationSettingsRelations = relations(
  autoRegulationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [autoRegulationSettings.userId],
      references: [users.id],
    }),
  }),
)
