'use client'

import { EditorContent, type Editor } from '@tiptap/react'
import type { SocketIOYjsProvider } from '@/features/editor/lib/socket-io-yjs-provider'
import { AwarenessCursors } from '@/features/editor/components/awareness-cursors'

type Props = {
  editor: Editor | null
  provider: SocketIOYjsProvider | null
}

export function TiptapEditor({ editor, provider }: Props) {
  if (!editor) {
    return (
      <div className="min-h-[460px] animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
    )
  }

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white">
      <AwarenessCursors editor={editor} provider={provider} field="body" />
      <EditorContent editor={editor} />
    </div>
  )
}