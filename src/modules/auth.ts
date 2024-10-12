import { Cookie, Elysia, t } from 'elysia'
import { ACCESS_TOKEN_EXPIRY, auth, REFRESH_TOKEN_EXPIRY } from '../libs/auth'
import { db } from '../db'
import { users } from '../models/user'
import { eq } from 'drizzle-orm'
import {
  generateUuid,
  hashPassword,
  verifyPassword,
} from '../libs/passwordManagement'

export const authModule = (app: Elysia) =>
  app
    .use(auth)
    .post(
      '/register',
      async ({
        set,
        body,
        signAccessToken,
        signRefreshToken,
        cookie: {
          accessToken: accessTokenCookie,
          refreshToken: refreshTokenCookie,
        },
      }) => {
        let email: string
        let password: string
        if (
          typeof body !== 'string' &&
          typeof body === 'object' &&
          body != null &&
          'email' in body &&
          'password' in body
        ) {
          email = `${body?.email}`
          password = `${body?.password}`
        } else if (typeof body === 'string') {
          const parsedBody = JSON.parse(body)
          email = parsedBody.email
          password = parsedBody.password
        } else {
          throw new Error('Invalid request body')
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (user.length) {
          set.status = 409
          return { error: 'User already exists' }
        }

        const newUser = await db
          .insert(users)
          .values({
            email,
            password: await hashPassword(password),
            id: generateUuid(),
          })
          .onConflictDoNothing()
          .returning()
          .catch((error) => {
            console.error('error', error)
            throw error
          })

        const accessToken = await signAccessToken({ userId: newUser[0].id })
        accessTokenCookie.value = accessToken
        accessTokenCookie.maxAge = ACCESS_TOKEN_EXPIRY
        const refreshToken = await signRefreshToken(newUser[0].id)
        refreshTokenCookie.value = refreshToken.refresh_token
        refreshTokenCookie.maxAge = new Date(refreshToken.expires_at).getTime()
        refreshTokenCookie.path = '/'

        return { accessToken, refreshToken, user: newUser[0] }
      },
    )
    .post(
      '/login',
      async ({
        body,
        signAccessToken,
        signRefreshToken,
        cookie: {
          accessToken: accessTokenCookie,
          refreshToken: refreshTokenCookie,
        },
      }) => {
        let email: string
        let password: string
        if (
          typeof body !== 'string' &&
          typeof body === 'object' &&
          body != null &&
          'email' in body &&
          'password' in body
        ) {
          email = `${body?.email}`
          password = `${body?.password}`
        } else if (typeof body === 'string') {
          const parsedBody = JSON.parse(body) as {
            email: string
            password: string
          }
          email = parsedBody.email
          password = parsedBody.password
        } else {
          throw new Error('Invalid request body')
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
          .execute()

        if (!user.length || !user[0].password) {
          throw new Error('Invalid credentials')
        }

        const passwordMatch = await verifyPassword(password, user[0].password)
        if (!passwordMatch) {
          throw new Error('Invalid credentials')
        }

        const accessToken = await signAccessToken({ userId: user[0].id })
        accessTokenCookie.value = accessToken
        accessTokenCookie.maxAge = ACCESS_TOKEN_EXPIRY

        const refreshToken = await signRefreshToken(user[0].id)
        refreshTokenCookie.value = refreshToken.refresh_token
        refreshTokenCookie.maxAge = REFRESH_TOKEN_EXPIRY
        refreshTokenCookie.path = '/'

        return {
          accessToken,
          refreshToken: refreshToken.refresh_token,
          user: { name: user[0].name, email: user[0].email },
        }
      },
    )
    .post('/logout', async ({ cookie: { refreshToken } }) => {
      refreshToken.value = ''
      refreshToken.maxAge = 0
      refreshToken.path = '/'

      return { success: true }
    })
    .post(
      '/refresh',
      async ({
        body,
        cookie: { refreshToken, accessToken },
        refreshAccessToken,
      }) => {
        const newTokens = await refreshAccessToken(
          body as { refreshToken: string } | string,
        )
        if (!newTokens) {
          return { error: 'Invalid refresh token' }
        }

        accessToken.value = newTokens.accessToken
        accessToken.path = '/'
        accessToken.expires = new Date(
          new Date().getTime() + ACCESS_TOKEN_EXPIRY * 1000,
        )
        refreshToken.value = newTokens.refreshToken
        refreshToken.path = '/'
        refreshToken.expires = new Date(
          new Date().getTime() + REFRESH_TOKEN_EXPIRY * 1000,
        )

        return newTokens
      },
    )
