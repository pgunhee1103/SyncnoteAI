import type {
  Server as SocketIOServer,
  Socket,
} from 'socket.io'
import * as Y from 'yjs'
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness'
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

type CollaborationUser = {
  id: string
  name: string
  color: string
}

type YjsJoinSuccess = {
  ok: true
  update: number[]
  awarenessUpdate: number[]
  user: CollaborationUser
}

type YjsJoinFailure = {
  ok: false
  message: string
}

type YjsJoinResponse =
  | YjsJoinSuccess
  | YjsJoinFailure

type YjsJoinAck = (
  response: YjsJoinResponse,
) => void

type YjsUpdatePayload = {
  room: string
  update: number[]
}

type YjsAwarenessPayload = {
  room: string
  update: number[]
  clientIds: number[]
}

type JoinIdentity = {
  id: string
  name: string
}

type RoomState = {
  doc: Y.Doc
  awareness: Awareness

  /*
   * 연결이 끊겼을 때 해당 소켓이 등록했던
   * Awareness client ID를 정확히 제거하기 위해 사용한다.
   */
  awarenessClientIdsBySocket: Map<
    string,
    Set<number>
  >

  /*
   * 같은 사용자는 재접속/다중 탭에서도 같은 색상을 사용하고,
   * 서로 다른 사용자는 같은 방에서 다른 색상을 사용한다.
   */
  colorByIdentity: Map<string, string>
}

const rooms = new Map<string, RoomState>()

const USER_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
]

function getRoomState(roomName: string): RoomState {
  const existing = rooms.get(roomName)

  if (existing) {
    return existing
  }

  const doc = new Y.Doc()
  const awareness = new Awareness(doc)

  /*
   * 서버 자체가 CollaboratorsBar에 사용자로 나타나지 않도록
   * 서버의 로컬 Awareness 상태는 제거한다.
   */
  awareness.setLocalState(null)

  const room: RoomState = {
    doc,
    awareness,
    awarenessClientIdsBySocket: new Map(),
    colorByIdentity: new Map(),
  }

  rooms.set(roomName, room)

  return room
}

function getSocketYjsRooms(
  socket: Socket,
): Set<string> {
  const existing = socket.data.yjsRooms as
    | Set<string>
    | undefined

  if (existing) {
    return existing
  }

  const created = new Set<string>()
  socket.data.yjsRooms = created

  return created
}

function hashText(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash =
      (hash * 31 + value.charCodeAt(index)) >>>
      0
  }

  return hash
}

function getOrAssignColor(
  room: RoomState,
  identityId: string,
): string {
  const existing =
    room.colorByIdentity.get(identityId)

  if (existing) {
    return existing
  }

  const usedColors = new Set(
    room.colorByIdentity.values(),
  )

  /*
   * 먼저 명확히 구분되는 고정 팔레트 중
   * 사용되지 않은 색을 배정한다.
   */
  const startIndex =
    hashText(identityId) % USER_COLORS.length

  for (
    let offset = 0;
    offset < USER_COLORS.length;
    offset += 1
  ) {
    const index =
      (startIndex + offset) %
      USER_COLORS.length

    const color = USER_COLORS[index]

    if (!usedColors.has(color)) {
      room.colorByIdentity.set(
        identityId,
        color,
      )

      return color
    }
  }

  /*
   * 팔레트보다 사용자가 많을 경우에도
   * 이미 사용 중인 색과 정확히 겹치지 않게 생성한다.
   */
  let attempt = 0

  while (attempt < 360) {
    const hue =
      (hashText(identityId) +
        attempt * 137) %
      360

    const color = `hsl(${hue} 72% 46%)`

    if (!usedColors.has(color)) {
      room.colorByIdentity.set(
        identityId,
        color,
      )

      return color
    }

    attempt += 1
  }

  const fallback =
    `hsl(${Date.now() % 360} 72% 46%)`

  room.colorByIdentity.set(
    identityId,
    fallback,
  )

  return fallback
}

async function getJoinIdentity(
  socket: Socket,
  payload: YjsJoinPayload,
): Promise<JoinIdentity | null> {
  const user = await getSocketUser(socket)

  if (user) {
    return {
      id: `user:${user.id}`,
      name: user.displayName,
    }
  }

  if (
    payload.shareId &&
    payload.guestId &&
    payload.guestName
  ) {
    return {
      id: `guest:${payload.guestId}`,
      name: payload.guestName,
    }
  }

  return null
}

async function canAccessDocument(
  documentId: string,
  identityId: string,
  shareId?: string,
): Promise<boolean> {
  const document =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        ownerId: true,
        shareId: true,
        shareCanEdit: true,
      },
    })

  if (!document) {
    return false
  }

  if (
    identityId.startsWith('user:') &&
    document.ownerId ===
      identityId.replace(/^user:/, '')
  ) {
    return true
  }

  if (
    shareId &&
    document.shareId === shareId &&
    document.shareCanEdit
  ) {
    return true
  }

  return false
}

function getCompleteAwarenessUpdate(
  room: RoomState,
): number[] {
  const clientIds = Array.from(
    room.awareness.getStates().keys(),
  )

  if (clientIds.length === 0) {
    return []
  }

  return Array.from(
    encodeAwarenessUpdate(
      room.awareness,
      clientIds,
    ),
  )
}

function removeSocketAwareness(
  socket: Socket,
  roomName: string,
) {
  const room = rooms.get(roomName)

  if (!room) {
    return
  }

  const clientIds = Array.from(
    room.awarenessClientIdsBySocket.get(
      socket.id,
    ) ?? [],
  )

  room.awarenessClientIdsBySocket.delete(
    socket.id,
  )

  if (clientIds.length === 0) {
    return
  }

  /*
   * 서버 Awareness에서도 제거한 뒤
   * null 상태 업데이트를 다른 참가자에게 보낸다.
   */
  removeAwarenessStates(
    room.awareness,
    clientIds,
    `disconnect:${socket.id}`,
  )

  const removalUpdate =
    encodeAwarenessUpdate(
      room.awareness,
      clientIds,
    )

  socket
    .to(roomName)
    .emit(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      {
        room: roomName,
        update: Array.from(removalUpdate),
        clientIds,
      },
    )
}

export function registerCollaborationHandlers(
  io: SocketIOServer,
) {
  io.on('connection', (socket: Socket) => {
    socket.on(
      SOCKET_EVENTS.YJS_JOIN,
      async (
        payload: YjsJoinPayload,
        ack?: YjsJoinAck,
      ) => {
        try {
          if (
            !payload ||
            typeof payload.room !== 'string' ||
            typeof payload.documentId !==
              'string'
          ) {
            ack?.({
              ok: false,
              message:
                '협업 입장 정보가 올바르지 않습니다.',
            })
            return
          }

          const expectedRoom =
            `document:${payload.documentId}`

          if (payload.room !== expectedRoom) {
            ack?.({
              ok: false,
              message:
                '협업 room 정보가 올바르지 않습니다.',
            })
            return
          }

          const identity =
            await getJoinIdentity(
              socket,
              payload,
            )

          if (!identity) {
            ack?.({
              ok: false,
              message:
                '협업 사용자 정보를 확인할 수 없습니다.',
            })
            return
          }

          const allowed =
            await canAccessDocument(
              payload.documentId,
              identity.id,
              payload.shareId,
            )

          if (!allowed) {
            ack?.({
              ok: false,
              message:
                '문서 편집 권한이 없습니다.',
            })
            return
          }

          const room = getRoomState(
            payload.room,
          )

          const color = getOrAssignColor(
            room,
            identity.id,
          )

          socket.join(payload.room)

          getSocketYjsRooms(socket).add(
            payload.room,
          )

          /*
           * 새로 입장한 사용자에게:
           * 1. 현재 Yjs 문서 전체
           * 2. 이미 접속 중인 사용자들의 Awareness 전체
           * 를 한 번에 전달한다.
           */
          ack?.({
            ok: true,
            update: Array.from(
              Y.encodeStateAsUpdate(room.doc),
            ),
            awarenessUpdate:
              getCompleteAwarenessUpdate(room),
            user: {
              id: identity.id,
              name: identity.name,
              color,
            },
          })
        } catch (error) {
          console.error(
            '[yjs] join error:',
            error,
          )

          ack?.({
            ok: false,
            message:
              '협업 room에 입장하지 못했습니다.',
          })
        }
      },
    )

    socket.on(
      SOCKET_EVENTS.YJS_SYNC_UPDATE,
      (payload: YjsUpdatePayload) => {
        if (
          !payload ||
          typeof payload.room !== 'string' ||
          !Array.isArray(payload.update)
        ) {
          return
        }

        if (!socket.rooms.has(payload.room)) {
          return
        }

        const room = getRoomState(
          payload.room,
        )

        const update = Uint8Array.from(
          payload.update,
        )

        Y.applyUpdate(
          room.doc,
          update,
          `socket:${socket.id}`,
        )

        socket
          .to(payload.room)
          .emit(
            SOCKET_EVENTS.YJS_SYNC_UPDATE,
            {
              room: payload.room,
              update: payload.update,
            },
          )
      },
    )

    socket.on(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      (
        payload: YjsAwarenessPayload,
      ) => {
        if (
          !payload ||
          typeof payload.room !== 'string' ||
          !Array.isArray(payload.update) ||
          !Array.isArray(payload.clientIds)
        ) {
          return
        }

        if (!socket.rooms.has(payload.room)) {
          return
        }

        const room = getRoomState(
          payload.room,
        )

        const socketClientIds =
          room.awarenessClientIdsBySocket.get(
            socket.id,
          ) ?? new Set<number>()

        for (
          const clientId of payload.clientIds
        ) {
          socketClientIds.add(clientId)
        }

        room.awarenessClientIdsBySocket.set(
          socket.id,
          socketClientIds,
        )

        applyAwarenessUpdate(
          room.awareness,
          Uint8Array.from(payload.update),
          `socket:${socket.id}`,
        )

        socket
          .to(payload.room)
          .emit(
            SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
            payload,
          )
      },
    )

    socket.on(
      SOCKET_EVENTS.YJS_LEAVE,
      ({
        room,
      }: {
        room?: string
      }) => {
        if (
          !room ||
          !socket.rooms.has(room)
        ) {
          return
        }

        removeSocketAwareness(
          socket,
          room,
        )

        getSocketYjsRooms(socket).delete(
          room,
        )

        socket.leave(room)
      },
    )

    socket.on('disconnect', () => {
      const joinedRooms = Array.from(
        getSocketYjsRooms(socket),
      )

      for (const roomName of joinedRooms) {
        removeSocketAwareness(
          socket,
          roomName,
        )
      }
    })
  })
}