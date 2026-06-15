'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket/socket-client'

export type ConnectionPhase =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'

export function useConnectionStatus() {
  const [phase, setPhase] = useState<ConnectionPhase>('disconnected')
  const [message, setMessage] = useState('실시간 연결 끊김')

  useEffect(() => {
    const socket = getSocket()

    function handleConnect() {
      setPhase('connected')
      setMessage('실시간 연결됨')
    }

    function handleDisconnect(reason: string) {
      setPhase('disconnected')
      setMessage(`실시간 연결 끊김 (${reason})`)
    }

    function handleReconnectAttempt(attempt: number) {
      setPhase('reconnecting')
      setMessage(`재연결 시도 중... (${attempt})`)
    }

    function handleConnectError(error: Error) {
      setPhase('error')
      setMessage(`연결 오류: ${error.message}`)
    }

    // 현재 상태 체크
    if (socket.connected) {
      setPhase('connected')
      setMessage('실시간 연결됨')
    }

    // socket.on: 일반 이벤트
    // socket.io.on: 내부 엔진 이벤트
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.off('connect_error', handleConnectError)
    }
  }, [])

  return { phase, message, connected: phase === 'connected' }
}