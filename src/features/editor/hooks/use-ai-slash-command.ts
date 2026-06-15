'use client'

import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { openAIPanel } from '@/features/ai/store/ai-panel-store'

type Props = {
  editor: Editor | null
}

export function useAISlashCommand({ editor }: Props) {
  const justHandledRef = useRef(false)

  useEffect(() => {
    if (!editor) return

    function handleUpdate() {
      if (!editor) return
      const { from } = editor.state.selection

      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 100),
        from,
        '\n',
      )

      const match = textBefore.match(/(^|\s)\/ai(?:\s+(.+))?$/)

      if (!match) {
        justHandledRef.current = false
        return
      }

      if (justHandledRef.current) {
        return
      }

      justHandledRef.current = true

      const fullMatch = match[0]
      const prompt = (match[2] ?? '').trim()

      const start = from - fullMatch.length
      const end = from

      editor
        .chain()
        .focus()
        .deleteRange({ from: start, to: end })
        .run()

      openAIPanel(prompt)
    }

    editor.on('update', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor])
}