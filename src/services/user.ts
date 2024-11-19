import { db } from '../db'
import { users, userTokens } from '../drizzle/schema'
import { eq } from 'drizzle-orm'
import { AuthContext } from '../types/auth'

export const getUser = async (
  refreshToken: string,
): Promise<AuthContext['user'] | null> => {
  const token = await db
    .select()
    .from(userTokens)
    .where(eq(userTokens.refresh_token, refreshToken))
    .limit(1)

  if (!token.length || !token[0].user_id) {
    return null
  }

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      created_at: users.created_at,
      first_name: users.first_name,
      last_name: users.last_name,
      updated_at: users.updated_at,
    })
    .from(users)
    .where(eq(users.id, token[0].user_id))
    .limit(1)

  if (!user.length) {
    return null
  }

  return user[0]
}
