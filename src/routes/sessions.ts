import { Elysia } from 'elysia'

export const sessionsRouter = new Elysia({ prefix: '/sessions' })
  .get('/', () => 'Get all sessions')
  .get('/:id', () => 'Get session by id')
  .post('/', () => 'Create new session')
  .put('/:id', () => 'Update session')
  .delete('/:id', () => 'Delete session')
