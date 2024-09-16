import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'

export const programs = pgTable('programs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  duration_weeks: integer('duration_weeks').notNull(),
  deload_week: boolean('deload_week').default(false),
  created_at: timestamp('created_at').defaultNow(),
})
