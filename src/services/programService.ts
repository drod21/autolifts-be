import { db } from '../db'
import { programs } from '../drizzle/schema'
import { desc, eq } from 'drizzle-orm'

interface CreateProgramInput {
  name: string
  duration_weeks: number
  deload_week?: boolean
  start_date: string
  end_date: string
  user_id: string
}

export const getPrograms = async (user_id: string) => {
  return await db
    .select()
    .from(programs)
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
}
