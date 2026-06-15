'use client'

import { useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import type { SocketIOYjsProvider } from '@/features/editor/lib/socket-io-yjs-provider'

type Props = {
  editor: Editor | null
  provider: SocketIOYjsProvider | null
  field: 'body' | 'title'
}

export function useAwarenessCursor({ editor, provider, field }: Props) {
  useEffect(() => {
    if (!editor) return
    if (!provider) return

    function updateCursor() {
      if (!editor) return
      if (!provider) return

      provider.awareness.setLocalStateField('cursor', {
        field,
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      })
    }

    function clearCursor() {
      if (!provider) return
      provider.awareness.setLocalStateField('cursor', null)
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