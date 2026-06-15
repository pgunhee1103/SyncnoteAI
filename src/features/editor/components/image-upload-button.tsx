'use client'

import type { Editor } from '@tiptap/react'

type Props = {
  editor: Editor | null
}

export function ImageUploadButton({ editor }: Props) {
  if (!editor) {
    return null
  }

  function handleAddImage() {
    const url = window.prompt('이미지 URL을 입력하세요.')

    if (!url || !editor) {
      return
    }

    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <button
      type="button"
      onClick={handleAddImage}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
    >
      Image URL
    </button>
  )
}