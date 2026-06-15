'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SocketIOYjsProvider } from '@/features/editor/lib/socket-io-yjs-provider'

type AwarenessState = {
  user?: {
    name?: string
    color?: string
  }
}

type Props = {
  provider: SocketIOYjsProvider | null
}

export function CollaboratorsBar({ provider }: Props) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!provider) return

    function sync() {
      setVersion((prev) => prev + 1)
    }

    provider.awareness.on('change', sync)
    provider.awareness.on('update', sync)

    return () => {
      provider.awareness.off('change', sync)
      provider.awareness.off('update', sync)
    }
  }, [provider])

  const users = useMemo(() => {
    if (!provider) return []

    return Array.from(provider.awareness.getStates().entries())
      .map(([clientId, state]) => {
        const awarenessState = state as AwarenessState

        return {
          clientId,
          name: awarenessState.user?.name ?? 'User',
          color: awarenessState.user?.color ?? '#3b82f6',
        }
      })
      .filter((user) => Boolean(user.name))
  }, [provider, version])

  if (users.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {users.map((user) => (
        <div
          key={user.clientId}
          className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: user.color }}
          />
          {user.name}
        </div>
      ))}
    </div>
  )
}