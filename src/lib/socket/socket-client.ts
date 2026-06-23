'use client'

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    /*
     * URL을 하드코딩하지 않는다.
     *
     * 현재 페이지가 localhost, 127.0.0.1, 내부 IP 중 무엇으로
     * 열렸든 동일한 origin의 Socket.IO 서버에 연결된다.
     * 로그인 쿠키도 같은 origin으로 전달된다.
     */
    socket = io({
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
  }

  return socket
}