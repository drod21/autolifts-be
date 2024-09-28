import { Elysia } from 'elysia'
import router from './router'

const app = new Elysia()

app.use(router)

app.listen(process.env.PORT || 3000, () => {
  console.log(
    '🚀 AutoRegs is running at ${app.server?.hostname}:${app.server?.port}`',
  )
})
