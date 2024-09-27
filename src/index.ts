import { Elysia } from 'elysia'
import router from './router'
import { auth } from './modules/auth'
import { jwtConfig } from './jwt.config'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { cache } from './cache'

const app = new Elysia()
  .use(auth)
  // .use(jwtConfig)
  .use(cors()) // Add this line to enable CORS
  .use(async (plugin) => {
    await cache.load()

    return plugin
  })
  .use(router)
  .listen(3000, () => {
    console.log('---------')
    console.log('Server is running at http://localhost:3000')
    console.log('---------')
  })
