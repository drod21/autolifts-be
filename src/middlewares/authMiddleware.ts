import { Elysia } from 'elysia'
import { auth } from '../libs/auth'

export const authMiddleware = new Elysia()
  .use(auth)
  .derive(async ({ headers, verifyAccessToken }) => {
    const authHeader = headers['authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized')
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyAccessToken(token)

    if (!payload) {
      throw new Error('Invalid token')
    }

    return { userId: payload.userId }
  })
