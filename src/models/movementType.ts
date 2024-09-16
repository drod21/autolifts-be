import { pgTable, serial, text } from 'drizzle-orm/pg-core'

export const movement_types = pgTable('movement_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})
