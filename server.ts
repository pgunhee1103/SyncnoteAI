// import { createServer } from 'node:http'
// import next from 'next'
// import { Server as SocketIOServer } from 'socket.io'
// import { registerCollaborationHandlers } from './src/server/socket/socket-server'

// console.log('[custom-server] server.ts loaded')

// const dev = process.env.NODE_ENV !== 'production'
// const hostname = 'localhost'
// const port = Number(process.env.PORT || 3000)

// const app = next({ dev, hostname, port })
// const handler = app.getRequestHandler()

// async function bootstrap() {
//   await app.prepare()

//   const httpServer = createServer(handler)

//   const io = new SocketIOServer(httpServer, {
//     cors: {
//       origin: `http://${hostname}:${port}`,
//       credentials: true,
//     },
//   })

//   registerCollaborationHandlers(io)

//   httpServer
//     .once('error', (err) => {
//       console.error(err)
//       process.exit(1)
//     })
//     .listen(port, () => {
//       console.log(`> Ready on http://${hostname}:${port}`)
//     })
// }

// void bootstrap()

import { createServer } from 'node:http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { registerCollaborationHandlers } from './src/server/socket/socket-server'

console.log('[custom-server] server.ts loaded')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = Number(process.env.PORT ?? 3000)

const app = next({
  dev,
  hostname,
  port,
})

const nextHandler = app.getRequestHandler()

async function bootstrap() {
  await app.prepare()

  const httpServer = createServer((req, res) => {
    void nextHandler(req, res)
  })

  /*
   * Next.js와 Socket.IO가 동일한 서버·origin을 사용한다.
   * 클라이언트도 io()로 현재 window.location에 연결한다.
   */
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
  })

  registerCollaborationHandlers(io)

  httpServer.once('error', (error) => {
    console.error('[custom-server] server error:', error)
    process.exit(1)
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
}

void bootstrap()