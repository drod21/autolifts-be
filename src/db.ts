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

const dbUser = process.env.DB_USER!
const dbPw = process.env.DB_PW!
const dbHost = process.env.DB_HOST!
const dbPort = process.env.DB_PORT!
const dbName = process.env.DB_NAME!
const dbUrl = process.env.DB_URL!

// Initialize the postgres client
const sql = postgres({
  database: dbName,
  port: parseInt(dbPort, 10),
  host: dbHost,
  user: dbUser,
  password: dbPw,
  // prepare: false,
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
