// src/db.ts

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { exercises } from './models/exercise'
import { programs } from './models/program'
import { workouts } from './models/workout'
import { workout_exercises } from './models/workoutExercise'
import { sets } from './models/set'
import { muscle_groups } from './models/muscleGroup'
import { movement_types } from './models/movementType'

// Initialize the postgres client
const sql = postgres({
  database: 'postgres',
  port: 6543,
  host: 'aws-0-us-east-1.pooler.supabase.com',
  user: 'postgres.yysbfaaovamrkpysevjx',
  password: '-rf#UkK.xVQ6Ej6',
})
// Initialize Drizzle ORM with the postgres client
export const db = drizzle(sql, {
  schema: {
    exercises,
    programs,
    workouts,
    workout_exercises,
    sets,
    muscle_groups,
    movement_types,
  },
})
