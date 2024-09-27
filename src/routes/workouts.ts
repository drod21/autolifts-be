import { Elysia } from 'elysia'

export const workoutsRouter = new Elysia({ prefix: '/workouts' })
  .get('/', () => 'Get all workouts')
  .get('/:id', () => 'Get workout by id')
  .post('/', () => 'Create new workout')
  .put('/:id', () => 'Update workout')
  .delete('/:id', () => 'Delete workout')
