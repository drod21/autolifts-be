import { Cookie, Elysia, t } from 'elysia'
// import {
//   ACCESS_TOKEN_EXPIRY,
//   auth,
//   REFRESH_TOKEN_EXPIRY,
//   verifyRefreshToken,
// } from '../libs/auth'
// import { db } from '../db'
import { users } from '../models/user'
import { eq } from 'drizzle-orm'
import {
  generateUuid,
  hashPassword,
  verifyPassword,
} from '../libs/passwordManagement'
import { supabase } from '../libs/supabase'
import cookie from '@elysiajs/cookie'
import { db } from '../db'

export const authModule = (app: Elysia) =>
  app.group('/auth', (app) =>
    app
      .post(
        '/signup',
        async ({ body, request }) => {
          console.log('body', body)
          try {
            const client = supabase(request)
            const { data: user } = await client.auth.signUp(body)
            const session = await client.auth.getSession()
            // store the user in the users table

            return {
              user,
              refresh_token: session.data.session?.refresh_token,
              access_token: session.data.session?.access_token,
            }
          } catch (error) {
            console.trace('error', error)
            return error
          }
        },
        {
          body: t.Object({
            email: t.String({
              format: 'email',
            }),
            firstName: t.String(),
            lastName: t.String(),
            password: t.String({
              minLength: 8,
            }),
          }),
        },
      )
      .post(
        '/login',
        async ({ body, request }) => {
          const client = supabase(request)
          const { data, error } = await client.auth.signInWithPassword(body)
          const session = await client.auth.getSession()
          if (error) return error

          return {
            user: data.user,
            refresh_token: session.data.session?.refresh_token,
            access_token: session.data.session?.access_token,
          }
        },
        {
          body: t.Object({
            email: t.String({
              format: 'email',
            }),
            password: t.String({
              minLength: 8,
            }),
          }),
        },
      )
      .post('/logout', async ({ set, request, cookie: { refreshToken } }) => {
        const client = supabase(request)
        await client.auth.signOut()
        refreshToken.value = ''
        refreshToken.maxAge = 0
        refreshToken.path = '/'
        set.status = 201
      })
      .get('/me', async ({ request }) => {
        const client = supabase(request)
        let session = await client.auth.getSession()

        const { data: user } = await client.auth.getUser(
          session.data.session?.access_token ?? '',
        )
        console.log(user)
        return user
      })
      .get('/refresh', async ({ request, cookie: { refresh_token } }) => {
        const client = supabase(request)
        if (!refresh_token.value) return { error: 'No refresh token' }

        const { data, error } = await client.auth.refreshSession({
          refresh_token: refresh_token.value,
        })

        if (error) return error

        refresh_token.value = data.session!.refresh_token

        return data.user
      }),
  )
