import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { db } from '../db'
import { users, userTokens } from '../models/user'
import { eq } from 'drizzle-orm'
import { generateUuid } from './passwordManagement'
import cookie from '@elysiajs/cookie'

export const ACCESS_TOKEN_EXPIRY = 15 * 60
export const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 14
const verifyRefreshToken = async (token: string) => {
  console.log('verifying...')
  const tokens = await db
    .select()
    .from(userTokens)
    .where(eq(userTokens.refresh_token, token))
    .leftJoin(users, eq(userTokens.user_id, users.id))
    .limit(1)

  const userToken = tokens[0].user_tokens

  if (!userToken || new Date() > new Date(userToken.expires_at)) {
    return null
  }

  return tokens[0].users
}

const signRefreshToken = async (userId: string) => {
  const token = generateUuid()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000) // 14 days from now
  const existingToken = await db
    .select()
    .from(userTokens)
    .where(eq(userTokens.user_id, userId))
    .limit(1)

  console.log('existingToken', existingToken)

  if (existingToken.length) {
    const res = await db
      .update(userTokens)
      .set({ refresh_token: token, expires_at: expiresAt })
      .where(eq(userTokens.id, existingToken[0].id))
      .returning()
    console.log('res', res, expiresAt)
    return res[0]
  } else {
    const result = await db
      .insert(userTokens)
      .values({
        id: generateUuid(),
        user_id: userId,
        refresh_token: token,
        expires_at: expiresAt,
      })
      .returning()
      .catch((error) => {
        console.error('Error signing refresh token', error)
        throw error
      })
    console.log('result', result)
    return result[0]
  }
}
export const auth = (app: Elysia) =>
  app
    .use(
      jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
        exp: ACCESS_TOKEN_EXPIRY,
      }),
    )
    .use(cookie())
    .derive(
      async ({
        jwt,
        set,
        cookie: { refreshToken, accessToken: accessTokenCookie },
      }) => {
        const signAccessToken = async (payload: any) => {
          const accessToken = await jwt.sign(payload)

          return accessToken
        }
        const verifyAccessToken = (token: string) => jwt.verify(token)

        const refreshAccessToken = async (
          body: string | { refreshToken: string },
        ) => {
          let rt: string
          if (typeof body === 'string') {
            rt = (JSON.parse(body) as { refreshToken: string })
              .refreshToken as string
          } else {
            rt = body.refreshToken
          }
          const refreshTokenValue = refreshToken.value ?? rt
          if (!refreshTokenValue) return null

          const user = await verifyRefreshToken(refreshTokenValue)
          if (!user) return null

          const accessToken = await signAccessToken({ userId: user.id })
          accessTokenCookie.value = accessToken
          return { accessToken, refreshToken: rt }
        }
        return {
          refreshAccessToken,
          verifyRefreshToken,
          signAccessToken,
          signRefreshToken,
          verifyAccessToken,
        }
      },
    )

export type Auth = typeof auth
