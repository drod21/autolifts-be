import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie } from 'hono/cookie' // Assuming this is the correct import
import { upgradeWebSocket } from 'hono/ws'
import router from './router'
// import { authModule } from './modules/auth' // Old auth module
import authRouter from './routers/auth' // New Hono auth router
import { cache } from './cache'
import { SessionSetInsert } from './drizzle/schema' // This might be used by WebSockets or router

const app = new Hono()

// Add CORS middleware
app.use('*', cors())

// Cookie parsing will be handled by getCookie where needed, or a separate middleware if we find one.

// WebSocket for /ws/sets
app.get(
  '/ws/sets',
  upgradeWebSocket((c) => {
    return {
      onMessage: (evt, ws) => {
        // evt.data is the message received
        // const message = JSON.parse(evt.data as string) // Assuming JSON messages
        // ws.publish('sets', message) // This is not how Hono does broadcast directly from client ws
        // Hono's server-side broadcast is usually via `app.websocketServer` or managing clients manually.
        // For simplicity, let's echo the message back or handle broadcasting if a simple way exists with upgradeWebSocket

        // The original code did ws.publish('sets', message)
        // Hono's `upgradeWebSocket` context `ws` is a `WebSocket` instance from `hono/ws`
        // It has `send` but not `publish` directly.
        // Broadcasting usually involves iterating over connected clients.
        // Let's log the message for now and revisit broadcast if needed or assume point-to-point.
        // The original `ws.publish('sets', message)` implies a pub/sub mechanism.
        // Bun's native server has `ws.publish(topic, data)`. Hono might expose this.

        // For now, let's assume the goal is to receive and process messages.
        // The original `ws.publish('sets', message)` suggests other clients subscribe to 'sets'.
        // Hono's `WebSocketServer` (accessed via `c.env.ws` in some contexts or `app.websocketServer` if set up)
        // would be needed for true pub/sub.
        // Let's keep the structure and try to make it work with Bun's publish if possible.

        console.log('WebSocket message received:', evt.data)

        // Attempting to replicate publish logic:
        // This is a simplified way and might need a proper client management/pub-sub system.
        // Hono itself doesn't provide a global `publish` on the `ws` object from `upgradeWebSocket` directly.
        // It would be `ws.raw.publish('sets', evt.data)` if `ws.raw` is a Bun WebSocket.
        if (ws.raw && typeof (ws.raw as any).publish === 'function') {
           (ws.raw as any).publish('sets', evt.data);
        } else {
          // Fallback or error if publish is not available
          console.warn('WebSocket publish not available on ws.raw');
          // ws.send(evt.data); // Echo back to sender if publish is not setup
        }
      },
      onOpen: (evt, ws) => {
        console.log('WebSocket connection opened')
        // ws.subscribe('sets') // Bun's native ws can subscribe to topics
        if (ws.raw && typeof (ws.raw as any).subscribe === 'function') {
          (ws.raw as any).subscribe('sets');
        }
      },
      onClose: (evt, ws) => {
        console.log('WebSocket connection closed')
      },
      onError: (evt, ws) => {
        console.error('WebSocket error:', evt)
      },
    }
  }),
)

// Cache loading
await cache.load()

// .use(swagger()) // Hono has swagger/openapi middleware too, can be added later

// Request/Response Logging Middleware
app.use('*', async (c, next) => {
  console.time('------ request ------')
  console.log(c.req.method, c.req.url)
  // console.log(c.req.raw.headers) // To log headers
  // To log body, it's more complex in Hono as stream needs to be cloned if read by multiple middlewares
  console.log('------ request ------')

  await next()

  console.log('------ response ------')
  // console.log(c.res.status, c.res.headers) // To log response status and headers
  console.timeEnd('------ response ------')
})

// Error Handling
app.onError((err, c) => {
  console.trace('error', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

// Routing and Auth
app.route('/auth', authRouter) // Mount the new Hono auth router at /auth
if (router) {
  app.route('/', router as any) // Mount the main app router (from src/router.ts) at root
}


// Start server (Bun export)
export default {
  port: 3000,
  fetch: app.fetch,
  // Add WebSocket handling here if Hono expects it at the top level server export for Bun
}

console.log('---------')
console.log(
  `Server is running at http://localhost:3000`,
)
console.log('---------')
