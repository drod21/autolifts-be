// import { Elysia } from 'elysia'
// import { jwt } from '@elysiajs/jwt'
// import { db } from '../db'
// import { users, userTokens } from '../models/user'
// import { eq } from 'drizzle-orm'
// import { generateUuid } from './passwordManagement'
// import cookie from '@elysiajs/cookie'
// import { getUser } from '../services/user'
// import { AuthContext } from '../types/auth'
// import { authMiddleware } from '../middleware/auth'
// import bearer from '@elysiajs/bearer'

// export const ACCESS_TOKEN_EXPIRY = 15 * 60 * 60
// export const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 14
// export const verifyRefreshToken = async (token: string) => {
//   console.log('verifying...')
//   const tokens = await db
//     .select({
//       user_tokens: userTokens,
//       users: { id: users.id, name: users.name, email: users.email },
//     })
//     .from(userTokens)
//     .where(eq(userTokens.refresh_token, token))
//     .leftJoin(users, eq(userTokens.user_id, users.id))
//     .limit(1)

//   const userToken = tokens?.[0]?.user_tokens

//   if (!userToken || new Date() > new Date(userToken.expires_at)) {
//     return null
//   }

//   return tokens[0].users
// }

// const signRefreshToken = async (userId: string) => {
//   const token = generateUuid()
//   const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000) // 14 days from now
//   const existingToken = await db
//     .select()
//     .from(userTokens)
//     .where(eq(userTokens.user_id, userId))
//     .limit(1)

//   if (existingToken.length) {
//     const res = await db
//       .update(userTokens)
//       .set({ refresh_token: token, expires_at: expiresAt })
//       .where(eq(userTokens.id, existingToken[0].id))
//       .returning()
//     return res[0]
//   } else {
//     const result = await db
//       .insert(userTokens)
//       .values({
//         id: generateUuid(),
//         user_id: userId,
//         refresh_token: token,
//         expires_at: expiresAt,
//       })
//       .returning()
//       .catch((error) => {
//         console.error('Error signing refresh token', error)
//         throw error
//       })
//     return result[0]
//   }
// }
// export const auth = (app: Elysia) =>
//   app
//     .use(bearer())
//     .use(async ({ bearer, set }) => {
//       const token = bearer.token
//       const user = await authMiddleware(token)
//       if (!user) {
//         set.status = 401
//         return
//       }

//       return user
//     })
//     // .use(
//     //   jwt({
//     //     name: 'jwt',
//     //     secret: process.env.JWT_SECRET!,
//     //     exp: ACCESS_TOKEN_EXPIRY,
//     //   }),
//     // )
// // .derive(
// //   async ({
// //     jwt,
// //     set,
// //     cookie: { refreshToken, accessToken: accessTokenCookie },
// //   }) => {
// //     const signAccessToken = async (payload: any) => {
// //       const accessToken = await jwt.sign(payload)

// //       return accessToken
// //     }
// //     const verifyAccessToken = (token: string) => jwt.verify(token)

// //     const refreshAccessToken = async (
// //       body: string | { refreshToken: string },
// //     ) => {
// //       let rt: string
// //       console.log('body', body)
// //       if (typeof body === 'string') {
// //         rt = (JSON.parse(body) as { refreshToken: string })
// //           .refreshToken as string
// //       } else {
// //         rt = body.refreshToken
// //         // }
// //         const refreshTokenValue = refreshToken.value ?? rt
// //         if (!refreshTokenValue) return null

// //         const user = await verifyRefreshToken(refreshTokenValue)
// //         if (!user) return null

// //         const accessToken = await signAccessToken({ userId: user.id })
// //         accessTokenCookie.value = accessToken
// //         return { accessToken, refreshToken: rt }
// //       }
// //     }
// //     console.log(
// //       'verifyAccessToken',
// //       await verifyAccessToken(accessTokenCookie.value ?? ''),
// //     )
// //     let user = null
// //     if (refreshToken.value) user = await getUser(refreshToken.value)

// //     return {
// //       user,
// //       signRefreshToken,
// //       refreshAccessToken,
// //       verifyRefreshToken,
// //       signAccessToken,
// //       verifyAccessToken,
// //     }
// //   },
// // )

// export type Auth = typeof auth
