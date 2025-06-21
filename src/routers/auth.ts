import { Hono, Context as HonoContext } from 'hono'
import { z } from 'zod'
import { zodValidator } from '@hono/zod-validator'
import { getCookie, setCookie } from 'hono/cookie'
import { supabase } from '../libs/supabase' // Assuming supabase client is in libs

// Define a type for Hono context if needed for variables, though not strictly necessary for these routes
// type AuthAppContext = HonoContext & { Variables: { ... } }

const authRouter = new Hono() // Can add <AuthAppContext> if defined

// Zod Schemas for validation
const signupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Signup route
authRouter.post(
  '/signup',
  zodValidator('json', signupSchema),
  async (c) => {
    const body = c.req.valid('json')
    try {
      const client = supabase(c.req.raw)
      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: {
            first_name: body.firstName,
            last_name: body.lastName,
          },
        },
      })

      if (signUpError) {
        return c.json({ error: signUpError.message }, 400)
      }
      if (!signUpData.session && signUpData.user?.identities?.length === 0) {
        return c.json({ error: 'User already exists or signup failed without session.' }, 400);
      }
      if (!signUpData.session) {
         // This case might mean email confirmation is required.
         // Supabase returns a user object but no session if confirmation is pending.
        return c.json({ message: 'Signup successful, please check your email for confirmation.', user: signUpData.user }, 200);
      }


      setCookie(c, 'sb_access_token', signUpData.session.access_token, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: signUpData.session.expires_in,
      })
      setCookie(c, 'sb_refresh_token', signUpData.session.refresh_token, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
        // MaxAge for refresh token is typically longer, e.g., weeks. Supabase client handles this.
      })

      return c.json({
        user: signUpData.user,
        refresh_token: signUpData.session.refresh_token,
        access_token: signUpData.session.access_token,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Signup error:', message, error)
      return c.json({ error: 'Signup failed', details: message }, 500)
    }
  },
)

// Login route
authRouter.post(
  '/login',
  zodValidator('json', loginSchema),
  async (c) => {
    const body = c.req.valid('json')
    const client = supabase(c.req.raw)
    const { data: signInData, error } = await client.auth.signInWithPassword(body)

    if (error) {
      return c.json({ error: error.message }, 401)
    }
    if (!signInData.session) {
        return c.json({ error: 'Login failed, no session returned.' }, 401);
    }

    setCookie(c, 'sb_access_token', signInData.session.access_token, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: signInData.session.expires_in,
    })
    setCookie(c, 'sb_refresh_token', signInData.session.refresh_token, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    })

    return c.json({
      user: signInData.user,
      refresh_token: signInData.session.refresh_token,
      access_token: signInData.session.access_token,
    })
  },
)

// Logout route
authRouter.post('/logout', async (c) => {
  const client = supabase(c.req.raw)
  const { error } = await client.auth.signOut()

  if (error) {
    // Even if Supabase signOut has an error, try to clear cookies.
    console.error('Supabase signOut error:', error.message)
  }

  setCookie(c, 'sb_access_token', '', { path: '/', maxAge: 0 })
  setCookie(c, 'sb_refresh_token', '', { path: '/', maxAge: 0 })
  // Original code also cleared 'refreshToken' (non-supabase specific name)
  setCookie(c, 'refreshToken', '', { path: '/', maxAge: 0 })


  if (error) {
    return c.json({ error: 'Logout failed partially', details: error.message }, 500)
  }

  return c.json({ message: 'Logged out successfully' }, 200)
})

// Me route
authRouter.get('/me', async (c) => {
  const client = supabase(c.req.raw)
  // The Supabase client automatically uses the access token from the cookie if available.
  // Or, if an Authorization header (Bearer token) is set and Supabase is configured for it.
  const { data: { user }, error } = await client.auth.getUser()

  if (error) {
    return c.json({ error: 'Failed to fetch user', details: error.message }, 401)
  }
  if (!user) {
    return c.json({ error: 'Not authenticated or session expired' }, 401)
  }
  return c.json(user)
})

// Refresh route
authRouter.get('/refresh', async (c) => {
  const client = supabase(c.req.raw)
  const currentRefreshToken = getCookie(c, 'sb_refresh_token')

  if (!currentRefreshToken) {
    return c.json({ error: 'No refresh token found' }, 401)
  }

  const { data, error } = await client.auth.refreshSession({
    refresh_token: currentRefreshToken,
  })

  if (error) {
    return c.json({ error: 'Failed to refresh session', details: error.message }, 401)
  }
  if (!data.session) {
    return c.json({ error: 'Refresh failed, no new session returned.' }, 401)
  }

  setCookie(c, 'sb_access_token', data.session.access_token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: data.session.expires_in,
  })
  setCookie(c, 'sb_refresh_token', data.session.refresh_token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
  })

  // The original also updated a cookie named 'refresh_token', let's ensure compatibility if other parts use it
  setCookie(c, 'refreshToken', data.session.refresh_token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
  })


  return c.json({ user: data.user, access_token: data.session.access_token })
})

export default authRouter
