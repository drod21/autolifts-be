import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { sql, db } from './db'

async function main() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: __dirname + '/drizzle/' })
  console.log('Migrations complete!')
  sql.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed!')
  console.error(err)
  process.exit(1)
})
