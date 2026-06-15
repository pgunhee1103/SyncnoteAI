'use client'

import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'
import { getSocket } from '@/lib/socket/socket-client'
import { SocketIOYjsProvider } from '@/features/editor/lib/socket-io-yjs-provider'

type SharedAccess = {
  shareId: string
  guestId: string
  guestName: string
}

type Props = {
  room: string
  documentId: string
  sharedAccess?: SharedAccess
}

const COLORS = [
  '#f97316',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#e11d48',
  '#14b8a6',
  '#f59e0b',
  '#06b6d4',
  '#84cc16',
  '#ec4899',
]

function getSharedKey(sharedAccess?: SharedAccess) {
  if (!sharedAccess) return 'owner'
  return `${sharedAccess.shareId}:${sharedAccess.guestId}:${sharedAccess.guestName}`
}

function getClientColor(key: string) {
  if (typeof window === 'undefined') return COLORS[0]

  const storageKey = `syncnote_color:${key}`
  const stored = window.sessionStorage.getItem(storageKey)

  if (stored) return stored

  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  window.sessionStorage.setItem(storageKey, color)

  return color
}

function getUserName(sharedAccess?: SharedAccess) {
  if (sharedAccess?.guestName) return sharedAccess.guestName
  return 'Owner'
}

export function useYjsProvider({ room, documentId, sharedAccess }: Props) {
  const sharedKey = getSharedKey(sharedAccess)
  const key = `${room}:${documentId}:${sharedKey}`

  const ydoc = useMemo(() => {
    return new Y.Doc()
  }, [key])

  const [provider, setProvider] = useState<SocketIOYjsProvider | null>(null)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    let mounted = true

    setSynced(false)
    setProvider(null)

    const nextProvider = new SocketIOYjsProvider({
      socket: getSocket(),
      room,
      documentId,
      doc: ydoc,
      sharedAccess,
      user: {
        name: getUserName(sharedAccess),
        color: getClientColor(key),
      },
      onSynced: () => {
        if (!mounted) return
        setSynced(true)
      },
    })

    if (mounted) {
      setProvider(nextProvider)
    }

    return () => {
      mounted = false
      nextProvider.destroy()
      ydoc.destroy()
    }
  }, [room, documentId, sharedKey, key, ydoc])

  return {
    provider,
    ydoc,
    synced,
  }
}