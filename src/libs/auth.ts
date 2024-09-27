import { Elysia } from 'elysia'
import { cookie } from '@elysiajs/cookie'
import { supabase } from './supabase'
import swagger from '@elysiajs/swagger'

export const authen = (app: Elysia) =>
  app

    .use(cookie())
    .derive(async ({ cookie: { access_token, refresh_token } }) => {
      const { data, error } = await supabase.auth.getUser(access_token.value)

      if (data.user)
        return {
          userId: data.user.id,
        }

      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession({
          refresh_token: refresh_token.value ?? '',
        })

      if (refreshError) throw error

      return {
        userId: refreshed.user!.id,
      }
    })
