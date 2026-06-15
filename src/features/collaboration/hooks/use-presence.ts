//파일 삭제예정(다른파일에서 사용중인지 확인 필요)
'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket/socket-client'
import { SOCKET_EVENTS } from '@/server/socket/socket-events'
import type { CollaboratorPresence, PresenceUpdatePayload } from '@/features/collaboration/types'

export function usePresence(documentId: string) {
  const [users, setUsers] = useState<CollaboratorPresence[]>([])

  useEffect(() => {
    const socket = getSocket()

    function handlePresence(payload: PresenceUpdatePayload) {
      // 지금 내가 보고 있는 문서에 대한 presence 업데이트만 처리
      if (payload.documentId !== documentId) {
        return
      }

      setUsers(payload.users)
    }

    // presence:update 이벤트가 오면 handlePresence 실행해라
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresence)

    return () => {
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresence)
    }
  }, [documentId])

  return users
}