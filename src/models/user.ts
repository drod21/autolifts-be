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
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull(),
  password: text('password').notNull(),
  created_at: timestamp('created_at'),
})

export const userTokens = pgTable('user_tokens', {
  id: uuid('id').primaryKey(),
  user_id: uuid('user_id').references(() => users.id),
  refresh_token: text('refresh_token').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  expires_at: timestamp('expires_at').notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserToken = typeof userTokens.$inferSelect
export type NewUserToken = typeof userTokens.$inferInsert
