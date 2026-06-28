import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { loadEnvFile } from 'node:process'
import { Server as SocketIOServer } from 'socket.io'

/*
 * Next.js와 별도 프로세스로 실행되므로
 * collaboration 서버가 직접 루트 .env를 읽어야 한다.
 */
if (existsSync('.env')) {
  loadEnvFile('.env')
}
// Render Web Service는 외부 요청을 받으려면 0.0.0.0에 bind하고, Render가 제공하는 포트를 사용해야 함
const port = Number(
  process.env.PORT ??
    process.env.COLLABORATION_PORT ??
    3001,
)
const host = process.env.COLLABORATION_HOST ?? '0.0.0.0'

const allowedOrigins = (
  process.env.WEB_ORIGIN ?? 'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

async function bootstrap() {
  /*
   * 환경변수를 먼저 로드한 다음 Prisma/Yjs를 사용하는
   * socket-server 모듈을 불러온다.
   */
  const { registerCollaborationHandlers } = await import(
    './src/server/socket/socket-server'
  )

  const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
      })

      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'syncnote-collaboration',
        }),
      )

      return
    }

    res.writeHead(404, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(
      JSON.stringify({
        message: 'Not Found',
      }),
    )
  })

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',

    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },

    transports: ['websocket', 'polling'],
  })

  registerCollaborationHandlers(io)

  httpServer.once('error', (error) => {
    console.error('[collaboration-server] server error:', error)
    process.exitCode = 1
  })

  function shutdown(signal: string) {
    console.log(`[collaboration-server] ${signal} received`)

    io.close(() => {
      httpServer.close(() => {
        console.log('[collaboration-server] stopped')
        process.exit(0)
      })
    })
  }

  process.once('SIGINT', () => {
    shutdown('SIGINT')
  })

  process.once('SIGTERM', () => {
    shutdown('SIGTERM')
  })

  httpServer.listen(port, host, () => {
    console.log(
      `[collaboration-server] ready on http://localhost:${port}`,
    )
    console.log(
      `[collaboration-server] allowed origins: ${allowedOrigins.join(', ')}`,
    )
  })
}

void bootstrap().catch((error) => {
  console.error('[collaboration-server] bootstrap error:', error)
  process.exit(1)
})