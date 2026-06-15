'use client'

import { EditorContent, type Editor } from '@tiptap/react'

type Props = {
  editor: Editor | null
}

export function TiptapEditor({ editor }: Props) {
  if (!editor) {
    return (
      <div className="min-h-[460px] animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <EditorContent editor={editor} />
    </div>
  )
}