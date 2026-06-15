'use client'

import { useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import type { SocketIOYjsProvider } from '@/features/editor/lib/socket-io-yjs-provider'

type CursorField = 'body' | 'title'

type AwarenessLocalState = {
  user?: {
    name?: string
    color?: string
  }
  activeField?: CursorField | null
  cursor?: {
    field: CursorField
    from: number
    to: number
  } | null
}

type Props = {
  editor: Editor | null
  provider: SocketIOYjsProvider | null
  field: CursorField
}

function isEditorFocused(editor: Editor) {
  if (editor.isFocused) {
    return true
  }

  const activeElement = document.activeElement

  if (!activeElement) {
    return false
  }

  return editor.view.dom.contains(activeElement)
}

export function useAwarenessCursor({ editor, provider, field }: Props) {
  useEffect(() => {
    if (!editor) return
    if (!provider) return

    function updateCursor() {
      if (!editor) return
      if (!provider) return

      // 핵심: focus 없는 editor의 transaction/selectionUpdate는 무시
      if (!isEditorFocused(editor)) {
        return
      }

      const currentState =
        (provider.awareness.getLocalState() as AwarenessLocalState | null) ?? {}

      provider.awareness.setLocalState({
        ...currentState,
        activeField: field,
        cursor: {
          field,
          from: editor.state.selection.from,
          to: editor.state.selection.to,
        },
      })
    }

    function clearCursor() {
      if (!provider) return

      const currentState =
        (provider.awareness.getLocalState() as AwarenessLocalState | null) ?? {}

      if (currentState.activeField !== field) {
        return
      }

      provider.awareness.setLocalState({
        ...currentState,
        activeField: null,
        cursor: null,
      })
    }

    editor.on('focus', updateCursor)
    editor.on('selectionUpdate', updateCursor)
    editor.on('transaction', updateCursor)
    editor.on('blur', clearCursor)

    return () => {
      editor.off('focus', updateCursor)
      editor.off('selectionUpdate', updateCursor)
      editor.off('transaction', updateCursor)
      editor.off('blur', clearCursor)

      clearCursor()
    }
  }, [editor, provider, field])
}