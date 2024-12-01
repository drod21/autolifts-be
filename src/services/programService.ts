import { db } from '../db'
import {
  exercises,
  programs,
  ProgramWorkoutInsert,
  workoutExercises,
  workouts,
} from '../drizzle/schema'
import { count, desc, eq, isNotNull } from 'drizzle-orm'
import { programWorkouts, workoutSessions } from '../drizzle/schema'
import { and } from 'drizzle-orm'

interface CreateProgramInput {
  name: string
  duration_weeks: number
  deload_week?: boolean
  start_date: string
  end_date: string
  user_id: string
}

export const getProgram = async (programId: string) => {
  const program = await db
    .select({
      id: programs.id,
      name: programs.name,
      start_date: programs.start_date,
      end_date: programs.end_date,
      has_deload_week: programs.has_deload_week,
      workouts_count: count(programWorkouts.id),
      programWorkouts: {
        id: programWorkouts.id,
        workout_sessions_count: count(workoutSessions.id),
        workout_id: programWorkouts.workout_id,
        workout_name: workouts.name,
        workouts: {
          id: workouts.id,
          name: workouts.name,
          exerciseCount: count(workoutExercises.id),
        },
      },
    })
    .from(programs)
    .leftJoin(programWorkouts, eq(programs.id, programWorkouts.program_id))
    .leftJoin(workoutSessions, eq(programs.id, workoutSessions.program_id))
    .leftJoin(workouts, eq(programWorkouts.workout_id, workouts.id))
    .leftJoin(workoutExercises, eq(workouts.id, workoutExercises.workout_id))
    .leftJoin(exercises, eq(workoutExercises.exercise_id, exercises.id))
    .groupBy(programs.id, programWorkouts.id, workouts.id)
    .where(eq(programs.id, programId))
    .execute()
  return program[0]
}

export const getPrograms = async (user_id: string) => {
  return await db
    .select({
      id: programs.id,
      name: programs.name,
      start_date: programs.start_date,
      end_date: programs.end_date,
      has_deload_week: programs.has_deload_week,
      workouts_count: count(programWorkouts.id),
      completed_workouts_count: count(workoutSessions.id),
    })
    .from(programs)
    .leftJoin(programWorkouts, eq(programs.id, programWorkouts.program_id))
    .leftJoin(workoutSessions, eq(programs.id, workoutSessions.program_id))
    .groupBy(programs.id)
    .where(eq(programs.user_id, user_id))
    .orderBy(desc(programs.start_date))
    .execute()
}

export const createProgram = async (input: CreateProgramInput) => {
  const {
    name,
    duration_weeks,
    deload_week = false,
    start_date,
    end_date,
    user_id,
  } = input

  try {
    const newProgram = await db
      .insert(programs)
      .values({
        name,
        duration_weeks,
        start_date,
        end_date,
        has_deload_week: deload_week,
        user_id,
      })
      .returning()
      .execute()
    return newProgram[0]
  } catch (error) {
    console.log(error)
    throw error
  }
}
export const createProgramWorkouts = async (input: ProgramWorkoutInsert[]) => {
  const newProgramWorkouts = await db
    .insert(programWorkouts)
    .values(input)
    .returning()
    .execute()
  return newProgramWorkouts
}

export const createProgramWorkout = async (input: ProgramWorkoutInsert) => {
  const newProgramWorkout = await db
    .insert(programWorkouts)
    .values(input)
    .returning()
    .execute()
  return newProgramWorkout[0]
}

export async function isProgramWorkoutCompleted(programWorkoutId: string) {
  const session = await db
    .select()
    .from(workoutSessions)
    .innerJoin(
      programWorkouts,
      and(
        eq(workoutSessions.workout_id, programWorkouts.workout_id),
        eq(workoutSessions.program_id, programWorkouts.program_id),
        eq(programWorkouts.id, programWorkoutId),
      ),
    )
    .limit(1)

  return session.length > 0
}

// Or to get completion status for multiple program workouts at once:
export async function getProgramWorkoutsCompletionStatus(programId: string) {
  const sessions = await db
    .select({
      programWorkoutId: programWorkouts.id,
      isCompleted: workoutSessions.id,
      completedAt: workoutSessions.actual_end,
    })
    .from(programWorkouts)
    .leftJoin(
      workoutSessions,
      and(
        eq(workoutSessions.workout_id, programWorkouts.workout_id),
        eq(workoutSessions.program_id, programWorkouts.program_id),
      ),
    )
    .where(
      and(
        eq(programWorkouts.program_id, programId),
        isNotNull(workoutSessions.id),
      ),
    )

  return sessions.map((session) => ({
    programWorkoutId: session.programWorkoutId,
    isCompleted: !!session.isCompleted,
    completedAt: session.completedAt,
  }))
}
