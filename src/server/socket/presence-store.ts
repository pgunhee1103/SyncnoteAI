//파일 삭제예정(다른파일에서 사용중인지 확인 필요)
import type { CollaboratorPresence } from '@/features/collaboration/types'

const documentUsers = new Map<string, Map<string, CollaboratorPresence>>()

export function addPresence(user: CollaboratorPresence) {
  const current = documentUsers.get(user.documentId) ?? new Map()
  current.set(user.socketId, user)
  documentUsers.set(user.documentId, current)
}

export function updatePresenceBodyCursor(
  documentId: string,
  socketId: string,
  cursor: {
    position: number | null
    visible: boolean
  },
) {
  const current = documentUsers.get(documentId)
  if (!current) return

  const user = current.get(socketId)
  if (!user) return

  current.set(socketId, {
    ...user,
    bodyCursorPosition: cursor.position,
    bodyCursorVisible: cursor.visible,
    titleEditing: cursor.visible ? false : user.titleEditing,
    titleCursorIndex: cursor.visible ? null : user.titleCursorIndex,
  })
}

export function updatePresenceTitleCursor(
  documentId: string,
  socketId: string,
  cursor: {
    index: number | null
    visible: boolean
  },
) {
  const current = documentUsers.get(documentId)
  if (!current) return

  const user = current.get(socketId)
  if (!user) return

  current.set(socketId, {
    ...user,
    titleCursorIndex: cursor.index,
    titleEditing: cursor.visible,
    bodyCursorVisible: cursor.visible ? false : user.bodyCursorVisible,
    bodyCursorPosition: cursor.visible ? null : user.bodyCursorPosition,
  })
}

export function clearPresenceCursors(documentId: string, socketId: string) {
  const current = documentUsers.get(documentId)
  if (!current) return

  const user = current.get(socketId)
  if (!user) return

  current.set(socketId, {
    ...user,
    bodyCursorPosition: null,
    bodyCursorVisible: false,
    titleCursorIndex: null,
    titleEditing: false,
  })
}

export function removePresence(documentId: string, socketId: string) {
  const current = documentUsers.get(documentId)
  if (!current) return

  current.delete(socketId)

  if (current.size === 0) {
    documentUsers.delete(documentId)
  }
}

export function getPresence(documentId: string): CollaboratorPresence[] {
  const current = documentUsers.get(documentId)
  if (!current) return []
  return Array.from(current.values())
}

export function getUsedColors(documentId: string): string[] {
  const current = documentUsers.get(documentId)
  if (!current) return []
  return Array.from(current.values()).map((user) => user.color)
}

export function removeSocketEverywhere(socketId: string) {
  for (const [documentId, users] of documentUsers.entries()) {
    if (users.has(socketId)) {
      users.delete(socketId)

      if (users.size === 0) {
        documentUsers.delete(documentId)
      }
    }
  }
}