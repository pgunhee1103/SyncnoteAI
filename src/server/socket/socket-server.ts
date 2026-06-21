import type { Server as SocketIOServer, Socket } from 'socket.io'
import * as Y from 'yjs'
import { prisma } from '@/server/db/prisma'
import { SOCKET_EVENTS } from '@/server/socket/socket-events'
import { getSocketUser } from '@/server/socket/socket-auth'

type YjsJoinPayload = {
  room: string
  documentId: string
  shareId?: string
  guestId?: string
  guestName?: string
}

type YjsUpdatePayload = {
  room: string
  update: number[]
}

type YjsAwarenessPayload = {
  room: string
  update: number[]
}

const yDocs = new Map<string, Y.Doc>()

function getYDoc(room: string) {
  const existing = yDocs.get(room)
  if (existing) return existing

  const ydoc = new Y.Doc()
  yDocs.set(room, ydoc)
  return ydoc
}

async function getJoinIdentity(socket: Socket, payload: YjsJoinPayload) {
  const user = await getSocketUser(socket)

  if (user) {
    return {
      userId: user.id,
      displayName: user.displayName,
    }
  }

  if (payload.shareId && payload.guestId && payload.guestName) {
    return {
      userId: `guest:${payload.guestId}`,
      displayName: payload.guestName,
    }
  }

  return null
}

async function canAccessDocument(
  documentId: string,
  userId?: string,
  shareId?: string,
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      ownerId: true,
      shareId: true,
      shareCanEdit: true,
    },
  })

  if (!document) return false
  if (userId && document.ownerId === userId) return true
  if (shareId && document.shareId === shareId && document.shareCanEdit) return true

  return false
}

export function registerCollaborationHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    socket.on(SOCKET_EVENTS.YJS_JOIN, async (payload: YjsJoinPayload) => {
      const identity = await getJoinIdentity(socket, payload)

      if (!identity) {
        socket.emit('error', { message: '접속 권한이 없습니다.' })
        return
      }

      const allowed = await canAccessDocument(
        payload.documentId,
        identity.userId.startsWith('guest:') ? undefined : identity.userId,
        payload.shareId,
      )

      if (!allowed) {
        socket.emit('error', { message: '문서 접근 권한이 없습니다.' })
        return
      }

      const ydoc = getYDoc(payload.room)

      socket.join(payload.room)

      socket.emit(SOCKET_EVENTS.YJS_SYNC_UPDATE, {
        room: payload.room,
        update: Array.from(Y.encodeStateAsUpdate(ydoc)),
      })
    })

    socket.on(SOCKET_EVENTS.YJS_SYNC_UPDATE, (payload: YjsUpdatePayload) => {
      if (!socket.rooms.has(payload.room)) return

      const ydoc = getYDoc(payload.room)
      const update = Uint8Array.from(payload.update)

      Y.applyUpdate(ydoc, update)

      socket.to(payload.room).emit(SOCKET_EVENTS.YJS_SYNC_UPDATE, {
        room: payload.room,
        update: payload.update,
      })
    })

    socket.on(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      (payload: YjsAwarenessPayload) => {
        if (!socket.rooms.has(payload.room)) return

        socket.to(payload.room).emit(SOCKET_EVENTS.YJS_AWARENESS_UPDATE, {
          room: payload.room,
          update: payload.update,
        })
      },
    )

    socket.on(SOCKET_EVENTS.YJS_LEAVE, ({ room }: { room: string }) => {
      socket.leave(room)
    })
  })
}