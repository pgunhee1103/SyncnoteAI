'use client'

import type { Editor } from '@tiptap/react'

type Props = {
  editor: Editor | null
}

export function EditorToolbar({ editor }: Props) {
  if (!editor) {
    return null
  }

  const buttonClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50'

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>

      <button
        type="button"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>

      <button
        type="button"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        Bullet
      </button>

      <button
        type="button"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </button>

      <button
        type="button"
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>

      <button
        type="button"
        className={buttonClass}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </button>
    </div>
  )
}