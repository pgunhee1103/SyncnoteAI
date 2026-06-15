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

function getSharedKey(sharedAccess?: SharedAccess) {
  if (!sharedAccess) return 'owner'
  return `${sharedAccess.shareId}:${sharedAccess.guestId}:${sharedAccess.guestName}`
}

export function useYjsProvider({ room, documentId, sharedAccess }: Props) {
  const key = `${room}:${documentId}:${getSharedKey(sharedAccess)}`

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
  }, [room, documentId, sharedAccess, ydoc])

  return {
    provider,
    ydoc,
    synced,
  }
}