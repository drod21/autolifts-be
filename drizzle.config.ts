import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './src/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    database: process.env.DB_DATABASE as string,
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
  },
})
