import { Elysia } from 'elysia'
import { fetchWorkoutsWithDetails } from '../services/workoutService'

export const workoutsRouter = new Elysia({ prefix: '/workouts' })
  .get('/', () => 'Get all workouts')
  .get('/:id', () => 'Get workout by id')
  .post('/', () => 'Create new workout')
  .put('/:id', () => 'Update workout')
  .delete('/:id', () => 'Delete workout')
  .get('/full', async () => {
    const workouts = await fetchWorkoutsWithDetails()
    return workouts
  })
