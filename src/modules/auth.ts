import { Elysia, t } from 'elysia'
import { supabase } from '../libs/supabase'

export const auth = (app: Elysia) =>
  app.group('/auth', (app) =>
    app
      .post('/sign-up', async ({ body }) => {
        const { email, password } = body as { email: string; password: string }
        const { data, error } = await supabase.auth.signUp({ email, password })

        if (error) return error
        return data.user
      })
      .post('/sign-in', async ({ body, cookie }) => {
        const { email, password } = JSON.parse(body as string)
        console.log(email, password, body)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        console.log(data)
        cookie.access_token.value = data.session?.access_token
        cookie.refresh_token.value = data.session?.refresh_token

        if (error) return error

        return data.user
      })
      .get('/refresh', async ({ cookie: { refresh_token } }) => {
        if (!refresh_token.cookie) {
          return false
        }
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: refresh_token.cookie?.value as string,
        })

        if (error) return error

        refresh_token.value = data.session!.refresh_token

        return data.user
      }),
  )
