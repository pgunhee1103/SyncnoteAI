'use client'

import type { ConnectionPhase } from '@/features/collaboration/hooks/use-connection-status'

type Props = {
  phase: ConnectionPhase
  message: string
}

export function ConnectionStatus({ phase, message }: Props) {
  const className =
    phase === 'connected'
      ? 'bg-green-100 text-green-700'
      : phase === 'reconnecting'
        ? 'bg-yellow-100 text-yellow-700'
        : phase === 'error'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700'

  return (
    <span className={`rounded px-2 py-1 text-xs ${className}`}>
      {message}
    </span>
  )
}