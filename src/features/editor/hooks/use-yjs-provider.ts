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

type ProviderCacheEntry = {
  ydoc: Y.Doc
  provider: SocketIOYjsProvider | null
  refs: number
  synced: boolean
  listeners: Set<() => void>
}

const providerCache = new Map<string, ProviderCacheEntry>()

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

function getUserName(sharedAccess?: SharedAccess) {
  if (sharedAccess?.guestName) return sharedAccess.guestName
  return 'Owner'
}

function getClientColor(documentId: string, sharedKey: string) {
  if (typeof window === 'undefined') return COLORS[0]

  const storageKey = `syncnote_color:${documentId}:${sharedKey}`
  const stored = window.sessionStorage.getItem(storageKey)

  if (stored) return stored

  let hash = 0
  const source = `${documentId}:${sharedKey}`

  for (let i = 0; i < source.length; i += 1) {
    hash = (hash + source.charCodeAt(i)) % COLORS.length
  }

  const color = COLORS[hash]
  window.sessionStorage.setItem(storageKey, color)

  return color
}

function getCacheEntry(cacheKey: string) {
  const existing = providerCache.get(cacheKey)

  if (existing) {
    return existing
  }

  const entry: ProviderCacheEntry = {
    ydoc: new Y.Doc(),
    provider: null,
    refs: 0,
    synced: false,
    listeners: new Set(),
  }

  providerCache.set(cacheKey, entry)

  return entry
}

function notify(entry: ProviderCacheEntry) {
  for (const listener of entry.listeners) {
    listener()
  }
}

export function useYjsProvider({ room, documentId, sharedAccess }: Props) {
  const sharedKey = getSharedKey(sharedAccess)
  const cacheKey = `${room}:${documentId}:${sharedKey}`

  const entry = useMemo(() => {
    return getCacheEntry(cacheKey)
  }, [cacheKey])

  const [version, setVersion] = useState(0)

  useEffect(() => {
    const listener = () => {
      setVersion((prev) => prev + 1)
    }

    entry.listeners.add(listener)
    entry.refs += 1

    if (!entry.provider) {
      entry.provider = new SocketIOYjsProvider({
        socket: getSocket(),
        room,
        documentId,
        doc: entry.ydoc,
        sharedAccess,
        user: {
          name: getUserName(sharedAccess),
          color: getClientColor(documentId, sharedKey),
        },
        onSynced: () => {
          entry.synced = true
          notify(entry)
        },
      })
    }

    notify(entry)

    return () => {
      entry.listeners.delete(listener)
      entry.refs -= 1

      if (entry.refs <= 0) {
        entry.provider?.destroy()
        entry.ydoc.destroy()
        providerCache.delete(cacheKey)
      }
    }
  }, [entry, cacheKey, room, documentId, sharedKey])

  return {
    provider: entry.provider,
    ydoc: entry.ydoc,
    synced: entry.synced,
    version,
  }
}