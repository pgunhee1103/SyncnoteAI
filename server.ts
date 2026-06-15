import { createServer } from 'node:http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { registerCollaborationHandlers } from './src/server/socket/socket-server'

console.log('[custom-server] server.ts loaded')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = Number(process.env.PORT || 3000)

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

async function bootstrap() {
  await app.prepare()

  const httpServer = createServer(handler)

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: `http://${hostname}:${port}`,
      credentials: true,
    },
  })

  registerCollaborationHandlers(io)

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
}

void bootstrap()