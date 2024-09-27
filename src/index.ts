import { Elysia } from 'elysia'
import router from './router'
import { authModule } from './modules/auth'
import { jwtConfig } from './jwt.config'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { cache } from './cache'
import { authen } from './libs/auth'

const app = new Elysia()
  .use(cors()) // Add this line to enable CORS

  .use(async (plugin) => {
    await cache.load()

    return plugin
  })
  .use(swagger())

  .use(authModule)
  .use(router)
  .use(async (plugin) => {
    // plugin.onBeforeHandle((ctx) => {
    //   console.log('------ request ------')
    //   console.log(ctx.request.method)
    //   console.log(ctx.request.url)
    //   console.log(ctx.request.headers)
    //   if (ctx.request.body) console.log(ctx.request.body.values())
    //   console.log('------ request ------')
    // })

    plugin.onAfterHandle((ctx) => {
      console.log('------ response ------')
      console.log(ctx.response)
      console.log('------ response ------')
    })
    return plugin
  })
  .listen(3000, () => {
    console.log('---------')
    console.log('Server is running at http://localhost:3000')
    console.log('---------')
  })
