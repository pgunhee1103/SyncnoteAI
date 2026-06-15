'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { SocketIOYjsProvider } from '@/features/editor/lib/socket-io-yjs-provider'

type AwarenessState = {
  user?: {
    name?: string
    color?: string
  }
  cursor?: {
    field?: 'body' | 'title'
    from?: number
    to?: number
  } | null
}

type CursorItem = {
  clientId: number
  name: string
  color: string
  left: number
  top: number
  height: number
}

type Props = {
  editor: Editor | null
  provider: SocketIOYjsProvider | null
  field: 'body' | 'title'
}

export function AwarenessCursors({ editor, provider, field }: Props) {
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

  const items = useMemo<CursorItem[]>(() => {
    if (!editor || !provider) return []

    const editorRect = editor.view.dom.getBoundingClientRect()
    const localClientId = provider.doc.clientID
    const result: CursorItem[] = []

    for (const [clientId, state] of provider.awareness.getStates().entries()) {
      if (clientId === localClientId) continue

      const awarenessState = state as AwarenessState
      const cursor = awarenessState.cursor

      if (!cursor) continue
      if (cursor.field !== field) continue
      if (typeof cursor.from !== 'number') continue

      try {
        const docSize = editor.state.doc.content.size
        const pos = Math.max(1, Math.min(cursor.from, docSize))
        const coords = editor.view.coordsAtPos(pos)
        const height = Math.max(18, coords.bottom - coords.top)

        result.push({
          clientId,
          name: awarenessState.user?.name ?? 'User',
          color: awarenessState.user?.color ?? '#3b82f6',
          left: coords.left - editorRect.left,
          top: coords.top - editorRect.top,
          height,
        })
      } catch {
        // 위치 계산 실패 시 표시하지 않음
      }
    }

    return result
  }, [editor, provider, field, version])

  if (!editor || !provider) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {items.map((item) => (
        <div
          key={item.clientId}
          className="absolute"
          style={{
            left: item.left,
            top: item.top,
          }}
        >
          <div
            style={{
              width: 2,
              height: item.height,
              borderRadius: 9999,
              backgroundColor: item.color,
            }}
          />

          <div
            className="absolute left-1 rounded px-2 py-0.5 text-[11px] font-medium text-white shadow"
            style={{
              top: -22,
              backgroundColor: item.color,
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </div>
        </div>
      ))}
    </div>
  )
}