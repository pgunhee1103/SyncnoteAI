'use client'
// 다른 origin의 서버에 연결할 때 서버 URL을 명시하고, 서버 쪽 CORS를 허용하도록 안내
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

function getCollaborationServerUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_COLLABORATION_URL?.trim()

  if (configuredUrl) {
    return configuredUrl
  }

  /*
   * 환경변수가 없으면 현재 페이지의 hostname을 사용하고
   * 협업 서버 기본 포트 3001로 접속한다.
   */
  return `${window.location.protocol}//${window.location.hostname}:3001`
}

export function getSocket(): Socket {
  if (!socket) {
    /*
     * URL을 하드코딩하지 않는다.
     *
     * 현재 페이지가 localhost, 127.0.0.1, 내부 IP 중 무엇으로
     * 열렸든 동일한 origin의 Socket.IO 서버에 연결된다.
     * 로그인 쿠키도 같은 origin으로 전달된다.
     */
    socket = io(getCollaborationServerUrl(), {
      path: '/socket.io',

      withCredentials: true,
      autoConnect: true,

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,

      timeout: 10000,

      transports: ['websocket', 'polling'],
    })
  }

  return socket
}

export function reconnectSocket(): void {
  const currentSocket = getSocket()

  if (currentSocket.connected) {
    currentSocket.disconnect()
  }

  currentSocket.connect()
}

export function disconnectSocket(): void {
  if (!socket) {
    return
  }

  socket.disconnect()
  socket = null
}