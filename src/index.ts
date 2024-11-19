import { Elysia, t } from 'elysia'
import router from './router'
import { authModule } from './modules/auth'
import { cors } from '@elysiajs/cors'
import { cache } from './cache'
import { SessionSetInsert } from './drizzle/schema'
import cookie from '@elysiajs/cookie'

const app = new Elysia()
  .use(cookie())
  .ws('/ws/sets', {
    // validate incoming message
    body: t.Object({
      type: t.Union([
        t.Literal('SET_UPDATE'),
        t.Literal('SET_CREATE'),
        t.Literal('SET_DELETE'),
      ]),
      data: t.Object({
        set_number: t.Number(),
        id: t.Optional(t.String()),
        session_id: t.Optional(t.String()),
        workout_exercise_id: t.Optional(t.String()),
        exercise_id: t.Optional(t.String()),
        planned_reps: t.Optional(t.Number()),
        actual_reps: t.Optional(t.Number()),
        weight: t.Optional(t.String()),
        rpe: t.Optional(t.Number()),
        isComplete: t.Optional(t.Boolean()),
        createdAt: t.Optional(t.String()),
        updatedAt: t.Optional(t.String()),
      }),
    }),
    message(
      ws,
      message: {
        type: 'SET_UPDATE' | 'SET_CREATE' | 'SET_DELETE'
        data: SessionSetInsert
      },
    ) {
      // Broadcast the message to all connected clients except sender
      ws.publish('sets', message)
    },
  })
  .use(cors()) // Add this line to enable CORS

  .use(async (plugin) => {
    await cache.load()

    return plugin
  })
  // .use(swagger())

  .use(authModule)
  .use(router)
  .use(async (plugin: Elysia) => {
    plugin.onBeforeHandle((ctx) => {
      console.time('------ request ------')
      // console.log(ctx.request.method)
      console.log(ctx.request.url)
      // console.log(ctx.request.headers)
      // if (ctx.request.body) console.log(ctx.request.body.values())
      console.log('------ request ------')
    })
    plugin.onAfterResponse((ctx) => {
      console.log('------ response ------')
      // console.log(ctx.response)
      console.timeEnd('------ response ------')
    })

    plugin.onError(({ error, code }) => {
      console.trace('error', error, code)
    })
    return plugin
  })

app.listen(3000, () => {
  console.log('---------')
  console.log(
    `Server is running at ${app.server?.hostname}:${app.server?.port}`,
  )
  console.log('---------')
})
