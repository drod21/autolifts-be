import { Elysia } from 'elysia'
import router from './router'
import { authModule } from './modules/auth'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { cache } from './cache'

const app = new Elysia()
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
