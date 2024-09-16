import { Elysia } from 'elysia'
import router from './router'

const app = new Elysia()

app.use(router)

app.listen(3001, () => {
  console.log('🚀 Server is running at http://localhost:3001')
})
