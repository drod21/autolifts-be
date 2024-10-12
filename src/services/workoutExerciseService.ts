import { db } from '../db'
import { eq, sql } from 'drizzle-orm'
import { NotFoundError } from '../errors'
import { muscle_groups } from '../models/muscleGroup'
import { adjustWeightAPRE } from '../algorithm'
import { createSet, createSets } from './setService'
import {
  sessionSets,
  workouts,
  workoutExercises,
  exercises,
  muscleGroups,
  WorkoutExerciseInsert,
} from '../drizzle/schema'

export const getWorkoutExercisesByWorkoutId = async (workout_id: string) => {
  type GroupedWorkoutExercise = {
    workoutExercise: typeof workoutExercises.$inferSelect
    sessionSets: (typeof sessionSets.$inferSelect)[]
    exercise: typeof exercises.$inferSelect
  }
  const result = await db
    .select({
      workout_exercise: workoutExercises,
      exercise: exercises,
      sessionSets: sessionSets,
    })
    .from(workoutExercises)
    .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .leftJoin(
      sessionSets,
      eq(workoutExercises.id, sessionSets.workoutExerciseId),
    )
    .where(eq(workoutExercises.workoutId, workout_id))
    .execute()

  // Group the results by workout_exercise
  const groupedResult = result.reduce(
    (acc, row) => {
      const workoutExerciseId = row.workout_exercise.id.toString()
      if (!acc[workoutExerciseId as keyof typeof acc]) {
        acc[workoutExerciseId as keyof typeof acc] = {
          workoutExercise: row.workout_exercise,
          exercise: row.exercise as typeof exercises.$inferSelect,
          sessionSets: [],
        }
      }
      if (row.sessionSets) {
        acc[workoutExerciseId].sessionSets.push(row.sessionSets)
      }
      return acc
    },
    {} as Record<string, GroupedWorkoutExercise>,
  )

  // Convert the grouped result to an array
  return Object.values(groupedResult)
}

export const createWorkoutExercise = async (input: WorkoutExerciseInsert) => {
  const newWorkoutExercise = await db
    .insert(workoutExercises)
    .values(input)
    .returning()
    .execute()

  const sets = []

  for (let i = 0; i < input.sets; i++) {
    sets.push({
      weight: input?.weight ?? '0',
      plannedReps: input?.repMax ?? 0,
      isComplete: false,
      setNumber: i + 1,
      workoutExerciseId: newWorkoutExercise[0].id,
    })
  }

  await createSets(sets)

  return newWorkoutExercise[0]
}

export const createWorkoutExercises = async (
  input: WorkoutExerciseInsert[],
) => {
  const newWorkoutExercises = await db
    .insert(workoutExercises)
    .values(input)
    .returning()
    .execute()
  return newWorkoutExercises
}

export const calculateWorkoutVolume = async (workout_id: number) => {
  const res = await db.execute(sql`SELECT
	mg.name AS muscle_group,
	SUM(s.weight * s.reps) AS volume
FROM ${sessionSets} s
JOIN ${workoutExercises} we ON s.workout_exercise_id = we.id
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
	s.plannedReps AS reps,
	s.rpe AS rpe,
	SUM(s.weight * s.plannedReps) AS volume
FROM ${sessionSets} s
JOIN ${workoutExercises} we ON s.workout_exercise_id = we.id
JOIN ${exercises} e ON we.exercise_id = e.id
JOIN ${muscle_groups} mg ON e.muscle_group_id = mg.id
WHERE we.workout_id = ${workout_id}
GROUP BY mg.name, e.name, s.weight, s.plannedReps, s.rpe`)

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
