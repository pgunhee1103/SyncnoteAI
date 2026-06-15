'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { parseEditorContent } from '@/features/editor/lib/editor-serializer'

type Props = {
  content: string
}

export function ReadonlyTiptapViewer({ content }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: '',
      }),
    ],
    content: parseEditorContent(content),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[220px] rounded-2xl border border-gray-200 bg-white p-4 outline-none',
      },
    },
  })

  if (!editor) {
    return <div className="min-h-[220px] rounded-2xl border border-gray-200 bg-gray-50" />
  }

  return <EditorContent editor={editor} />
}