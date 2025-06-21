import { Hono } from 'hono'

// Define a type for Hono context if needed for this router, e.g., if using specific vars
// For now, using default Hono context
// type SessionsAppContext = HonoContext & { Variables: { ... } }

const sessionsRouter = new Hono() // Can add <SessionsAppContext> if defined

sessionsRouter.get('/', (c) => c.text('Get all sessions'))
sessionsRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.text(`Get session by id: ${id}`)
})
sessionsRouter.post('/', (c) => c.text('Create new session'))
sessionsRouter.put('/:id', (c) => {
  const id = c.req.param('id')
  return c.text(`Update session: ${id}`)
})
sessionsRouter.delete('/:id', (c) => {
  const id = c.req.param('id')
  return c.text(`Delete session: ${id}`)
})

export default sessionsRouter
