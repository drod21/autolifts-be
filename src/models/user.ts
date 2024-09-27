import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  created_at: timestamp('created_at'),
  supabase_auth_uid: uuid('user_id'),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
