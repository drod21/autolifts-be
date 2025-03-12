import { relations } from 'drizzle-orm/relations'
import {
  users,
  workouts,
  profiles,
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

export const usersRelations = relations(users, ({ many, one }) => ({
  profiles: one(profiles, {
    fields: [users.id],
    references: [profiles.user_id],
  }),
  workouts: many(workouts),
  exercises: many(exercises),
  programs: many(programs),
  workoutSessions: many(workoutSessions),
  autoRegulationSettings: many(autoRegulationSettings),
}))

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, { fields: [workouts.user_id], references: [users.id] }),
  workoutExercises: many(workoutExercises),
  programWorkouts: many(programWorkouts),
  workoutSessions: many(workoutSessions),
}))

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  movementType: one(movementTypes, {
    fields: [exercises.movement_type_id],
    references: [movementTypes.id],
  }),
  muscleGroup: one(muscleGroups, {
    fields: [exercises.muscle_group_id],
    references: [muscleGroups.id],
  }),
  user: one(users, { fields: [exercises.user_id], references: [users.id] }),
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
      fields: [workoutExercises.exercise_id],
      references: [exercises.id],
    }),
    workout: one(workouts, {
      fields: [workoutExercises.workout_id],
      references: [workouts.id],
    }),
    sessionSets: many(sessionSets),
  }),
)

export const programsRelations = relations(programs, ({ one, many }) => ({
  user: one(users, { fields: [programs.user_id], references: [users.id] }),
  programWorkouts: many(programWorkouts),
  workoutSessions: many(workoutSessions),
}))

export const programWorkoutsRelations = relations(
  programWorkouts,
  ({ one }) => ({
    program: one(programs, {
      fields: [programWorkouts.program_id],
      references: [programs.id],
    }),
    workout: one(workouts, {
      fields: [programWorkouts.workout_id],
      references: [workouts.id],
    }),
  }),
)

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    program: one(programs, {
      fields: [workoutSessions.program_id],
      references: [programs.id],
    }),
    user: one(users, {
      fields: [workoutSessions.user_id],
      references: [users.id],
    }),
    workout: one(workouts, {
      fields: [workoutSessions.workout_id],
      references: [workouts.id],
    }),
    sessionSets: many(sessionSets),
  }),
)

export const sessionSetsRelations = relations(sessionSets, ({ one }) => ({
  exercise: one(exercises, {
    fields: [sessionSets.exercise_id],
    references: [exercises.id],
  }),
  workoutSession: one(workoutSessions, {
    fields: [sessionSets.session_id],
    references: [workoutSessions.id],
  }),
  workoutExercise: one(workoutExercises, {
    fields: [sessionSets.workout_exercise_id],
    references: [workoutExercises.id],
  }),
}))

export const autoRegulationSettingsRelations = relations(
  autoRegulationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [autoRegulationSettings.user_id],
      references: [users.id],
    }),
  }),
)
