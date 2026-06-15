import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import type * as Y from 'yjs'
import { AICommandHighlight } from '@/features/editor/lib/ai-command-highlight'

type CreateExtensionsProps = {
  ydoc: Y.Doc
  field: string
  placeholder: string
  enableAI?: boolean
}

export function createTiptapExtensions({
  ydoc,
  field,
  placeholder,
  enableAI = false,
}: CreateExtensionsProps) {
  return [
    StarterKit.configure({
      undoRedo: false,
    }),
    Image,
    Placeholder.configure({
      placeholder,
    }),
    Collaboration.configure({
      document: ydoc,
      field,
    }),
    ...(enableAI ? [AICommandHighlight] : []),
  ]
}