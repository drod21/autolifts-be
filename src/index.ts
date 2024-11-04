import { Elysia, t } from 'elysia'
import router from './router'
import { authModule } from './modules/auth'
import { cors } from '@elysiajs/cors'
import { cache } from './cache'
import { SessionSetInsert } from './drizzle/schema'

const app = new Elysia()
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
  .use(async (plugin) => {
    plugin.onBeforeHandle((ctx) => {
      console.log('------ request ------')
      // console.log(ctx.request.method)
      console.log(ctx.request.url)
      // console.log(ctx.request.headers)
      // if (ctx.request.body) console.log(ctx.request.body.values())
      console.log('------ request ------')
    })
    plugin.onAfterResponse((ctx) => {
      console.log('------ response ------')
      console.log(ctx.response)
      console.log('------ response ------')
    })

    plugin.onError((error) => {
      console.error('error', error)
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
