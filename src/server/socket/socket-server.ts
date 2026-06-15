// import type { Server as SocketIOServer, Socket } from 'socket.io'
// import { prisma } from '@/server/db/prisma'
// import { SOCKET_EVENTS } from '@/server/socket/socket-events'
// import { getSocketUser } from '@/server/socket/socket-auth'
// import {
//   addPresence,
//   clearPresenceCursors,
//   getPresence,
//   getUsedColors,
//   removePresence,
//   removeSocketEverywhere,
//   updatePresenceBodyCursor,
//   updatePresenceTitleCursor,
// } from '@/server/socket/presence-store'
// import type {
//   BodyCursorUpdatePayload,
//   CollaboratorPresence,
//   JoinDocumentPayload,
//   TitleCursorUpdatePayload,
//   TitleUpdatePayload,
// } from '@/features/collaboration/types'

// const USER_COLORS = [
//   '#f97316',
//   '#22c55e',
//   '#3b82f6',
//   '#a855f7',
//   '#e11d48',
//   '#14b8a6',
//   '#f59e0b',
//   '#06b6d4',
//   '#84cc16',
//   '#ec4899',
// ]

// function pickAvailableColor(documentId: string) {
//   const usedColors = new Set(getUsedColors(documentId))
//   const available = USER_COLORS.filter((color) => !usedColors.has(color))

//   if (available.length > 0) {
//     const randomIndex = Math.floor(Math.random() * available.length)
//     return available[randomIndex]
//   }

//   const hue = Math.floor(Math.random() * 360)
//   return `hsl(${hue} 70% 50%)`
// }

// async function getJoinIdentity(socket: Socket, payload: JoinDocumentPayload) {
//   const user = await getSocketUser(socket)

//   if (user) {
//     return {
//       userId: user.id,
//       displayName: user.displayName,
//     }
//   }

//   if (payload.shareId && payload.guestId && payload.guestName) {
//     return {
//       userId: `guest:${payload.guestId}`,
//       displayName: payload.guestName,
//     }
//   }

//   return null
// }

// async function canAccessDocument(
//   documentId: string,
//   userId?: string,
//   shareId?: string,
// ) {
//   const document = await prisma.document.findUnique({
//     where: { id: documentId },
//     select: {
//       id: true,
//       ownerId: true,
//       shareId: true,
//       shareCanEdit: true,
//     },
//   })

//   if (!document) return false

//   if (userId && document.ownerId === userId) {
//     return true
//   }

//   if (shareId && document.shareId === shareId && document.shareCanEdit) {
//     return true
//   }

//   return false
// }

// function emitPresence(io: SocketIOServer, documentId: string) {
//   io.to(documentId).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
//     documentId,
//     users: getPresence(documentId),
//   })
// }

// export function registerCollaborationHandlers(io: SocketIOServer) {
//   io.on('connection', (socket: Socket) => {
//     socket.on(
//       SOCKET_EVENTS.DOCUMENT_JOIN,
//       async (payload: JoinDocumentPayload) => {
//         const identity = await getJoinIdentity(socket, payload)

//         if (!identity) {
//           socket.emit('error', { message: '접속 권한이 없습니다.' })
//           return
//         }

//         const allowed = await canAccessDocument(
//           payload.documentId,
//           identity.userId.startsWith('guest:') ? undefined : identity.userId,
//           payload.shareId,
//         )

//         if (!allowed) {
//           socket.emit('error', { message: '문서 접근 권한이 없습니다.' })
//           return
//         }

//         socket.join(payload.documentId)
//         socket.data.documentId = payload.documentId
//         socket.data.userId = identity.userId
//         socket.data.displayName = identity.displayName

//         const presenceUser: CollaboratorPresence = {
//           userId: identity.userId,
//           displayName: identity.displayName,
//           documentId: payload.documentId,
//           socketId: socket.id,
//           color: pickAvailableColor(payload.documentId),
//           bodyCursorPosition: null,
//           bodyCursorVisible: false,
//           titleCursorIndex: null,
//           titleEditing: false,
//         }

//         addPresence(presenceUser)
//         emitPresence(io, payload.documentId)

//       },
//     )

//     socket.on(
//       SOCKET_EVENTS.TITLE_UPDATE,
//       ({ documentId, title, sourceSocketId }: TitleUpdatePayload) => {
//         if (!socket.rooms.has(documentId)) return

//         socket.to(documentId).emit(SOCKET_EVENTS.TITLE_UPDATE, {
//           documentId,
//           title,
//           sourceSocketId,
//         })
//       },
//     )

//     socket.on(
//       SOCKET_EVENTS.TITLE_CURSOR_UPDATE,
//       ({ documentId, index, visible }: TitleCursorUpdatePayload) => {
//         if (!socket.rooms.has(documentId)) return

//         updatePresenceTitleCursor(documentId, socket.id, {
//           index,
//           visible,
//         })
//         emitPresence(io, documentId)
//       },
//     )

//     socket.on(
//       SOCKET_EVENTS.BODY_CURSOR_UPDATE,
//       ({ documentId, position, visible }: BodyCursorUpdatePayload) => {
//         if (!socket.rooms.has(documentId)) return

//         updatePresenceBodyCursor(documentId, socket.id, {
//           position,
//           visible,
//         })
//         emitPresence(io, documentId)
//       },
//     )

//     socket.on(SOCKET_EVENTS.DOCUMENT_LEAVE, ({ documentId }: JoinDocumentPayload) => {
//       socket.leave(documentId)
//       removePresence(documentId, socket.id)
//       emitPresence(io, documentId)
//     })

//     socket.on('disconnect', () => {
//       const documentId = socket.data.documentId as string | undefined

//       if (documentId) {
//         clearPresenceCursors(documentId, socket.id)
//       }

//       removeSocketEverywhere(socket.id)

//       if (documentId) {
//         emitPresence(io, documentId)
//       }
//     })
//   })
// }

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