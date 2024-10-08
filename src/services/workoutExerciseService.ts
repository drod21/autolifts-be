import { db } from '../db'
import { workout_exercises } from '../models/workoutExercise'
import { eq, sql } from 'drizzle-orm'
import { NotFoundError } from '../errors'
import { exercises } from '../models/exercise'
import { sets } from '../models/set'
import { muscle_groups } from '../models/muscleGroup'
import { workouts } from '../models/workout'
import { adjustWeightAPRE } from '../algorithm'
import { createSet } from './setService'

export type CreateWorkoutExerciseInput = typeof workout_exercises.$inferInsert

export const getWorkoutExercisesByWorkoutId = async (workout_id: number) => {
  type GroupedWorkoutExercise = {
    workoutExercise: typeof workout_exercises.$inferSelect
    sets: (typeof sets.$inferSelect)[]
    exercise: typeof exercises.$inferSelect
  }
  const result = await db
    .select({
      workout_exercise: workout_exercises,
      exercise: exercises,
      set: sets,
    })
    .from(workout_exercises)
    .leftJoin(exercises, eq(workout_exercises.exercise_id, exercises.id))
    .leftJoin(sets, eq(workout_exercises.id, sets.workout_exercise_id))
    .where(eq(workout_exercises.workout_id, workout_id))
    .execute()

  // Group the results by workout_exercise
  const groupedResult = result.reduce(
    (acc, row) => {
      const workoutExerciseId = row.workout_exercise.id.toString()
      if (!acc[workoutExerciseId as keyof typeof acc]) {
        acc[workoutExerciseId as keyof typeof acc] = {
          workoutExercise: row.workout_exercise,
          exercise: row.exercise as typeof exercises.$inferSelect,
          sets: [],
        }
      }
      if (row.set) {
        acc[workoutExerciseId].sets.push(row.set)
      }
      return acc
    },
    {} as Record<string, GroupedWorkoutExercise>,
  )

  // Convert the grouped result to an array
  return Object.values(groupedResult)
}

type CreateSetInput = typeof sets.$inferInsert

export const createWorkoutExercise = async (
  input: CreateWorkoutExerciseInput,
) => {
  const {
    workout_id,
    exercise_id,
    sets: setsCount,
    reps_min = null,
    reps_max,
    rest_timer,
    target_weight = 0,
  } = input

  const newWorkoutExercise = await db
    .insert(workout_exercises)
    .values({
      workout_id,
      exercise_id,
      sets: setsCount,
      reps_min,
      reps_max,
      rest_timer,
      target_weight,
    })
    .returning()
    .execute()

  const setPromises = []

  for (let i = 0; i < setsCount; i++) {
    setPromises.push(
      createSet({
        weight: target_weight ?? 0,
        reps: reps_max ?? 0,
        completed: false,
        workout_exercise_id: newWorkoutExercise[0].id,
      }),
    )
  }

  await Promise.allSettled(setPromises)

  return newWorkoutExercise[0]
}

export const createWorkoutExercises = async (
  input: CreateWorkoutExerciseInput[],
) => {
  const newWorkoutExercises = await db
    .insert(workout_exercises)
    .values(input)
    .returning()
    .execute()
  return newWorkoutExercises
}

export const calculateWorkoutVolume = async (workout_id: number) => {
  const res = await db.execute(sql`SELECT
	mg.name AS muscle_group,
	SUM(s.weight * s.reps) AS volume
FROM ${sets} s
JOIN ${workout_exercises} we ON s.workout_exercise_id = we.id
JOIN ${exercises} e ON we.exercise_id = e.id
JOIN ${muscle_groups} mg ON e.muscle_group_id = mg.id
WHERE we.workout_id = ${workout_id}
GROUP BY mg.name`)

  let totalVolume = 0
  const volumes = res.reduce((acc: any, row: any) => {
    acc[row.muscle_group] = parseFloat(row.volume)
    totalVolume += parseFloat(row.volume)
    return acc
  }, {})

  return {
    totalVolume,
    volumes,
  }
}

export const getAutoregulationAdjustments = async (workout_id: number) => {
  const res = await db.execute(sql`SELECT
	e.name AS exercise,
	COUNT(s.id) AS sets,
	s.weight AS weight,
	s.reps AS reps,
	s.rpe AS rpe,
	SUM(s.weight * s.reps) AS volume
FROM ${sets} s
JOIN ${workout_exercises} we ON s.workout_exercise_id = we.id
JOIN ${exercises} e ON we.exercise_id = e.id
JOIN ${muscle_groups} mg ON e.muscle_group_id = mg.id
WHERE we.workout_id = ${workout_id}
GROUP BY mg.name, e.name, s.weight, s.reps, s.rpe`)

  const totalRpe = res.reduce(
    (acc: any, row: any) => {
      if (!acc[row.exercise]) {
        acc[row.exercise] = [parseFloat(row.rpe)]
      } else {
        acc[row.exercise].push(parseFloat(row.rpe))
      }
      return acc
    },
    {} as Record<string, number[]>,
  )

  const avgRpe = Object.keys(totalRpe).reduce((acc: any, exercise: string) => {
    acc[exercise] =
      totalRpe[exercise].reduce((acc: any, rpe: number) => acc + rpe, 0) /
      totalRpe[exercise].length
    return acc
  }, {})

  const adjustments = res.map((row: any) => {
    const weight = parseFloat(row.weight)
    const reps = parseFloat(row.reps)
    const rpe = parseFloat(row.rpe)
    const adjustment =
      weight -
      adjustWeightAPRE(6)({
        rpe,
        weight,
        reps,
      })

    return {
      workout_exercise_id: row.workout_exercise_id,
      exercise_name: row.exercise_name,
      avg_rpe: avgRpe,
      adjustment,
      adjusted_weight: adjustment + weight,
      message:
        adjustment + weight > weight
          ? `Increase weight by ${adjustment}`
          : `Decrease weight by ${adjustment}`,
    }
  })

  return adjustments
}

export const getWorkoutSummary = async (workout_id: number) => {
  const { totalVolume, volumes } = await calculateWorkoutVolume(workout_id)
  const adjustments = await getAutoregulationAdjustments(workout_id)

  return {
    totalVolume: totalVolume,
    muscleGroupVolumes: volumes,
    adjustments,
  }
}
