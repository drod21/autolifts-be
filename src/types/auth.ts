import type { User } from '../drizzle/schema'

export interface AuthContext {
  user: User | null
}
