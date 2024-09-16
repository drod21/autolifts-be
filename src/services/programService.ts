import { db } from '../db'
import { programs } from '../models/program'
import { desc } from 'drizzle-orm'

interface CreateProgramInput {
  name: string
  duration_weeks: number
  deload_week?: boolean
}

export const getPrograms = async () => {
  return await db
    .select()
    .from(programs)
    .orderBy(desc(programs.created_at))
    .execute()
}

export const createProgram = async (input: CreateProgramInput) => {
  const { name, duration_weeks, deload_week = false } = input

  const newProgram = await db
    .insert(programs)
    .values({
      name,
      duration_weeks,
      deload_week,
    })
    .returning()
    .execute()

  return newProgram[0]
}
