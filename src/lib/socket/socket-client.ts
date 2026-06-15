'use client'

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  // 싱글톤 (Singleton) 패턴: 앱 전체에서 하나만 존재
  if (!socket) {
    // localhost:3000 서버랑 실시간 연결해줘
    socket = io('http://localhost:3000', {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
  }

  return socket
}