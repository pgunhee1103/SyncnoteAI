'use client'

import {
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  useEditor,
  type Editor,
} from '@tiptap/react'
import { createTiptapExtensions } from '@/features/editor/lib/tiptap-extensions'
import { useDocumentCollaboration } from '@/features/collaboration/components/document-collaboration-provider'
import { useAwarenessCursor } from '@/features/editor/hooks/use-awareness-cursor'
import {
  parseEditorContent,
  stringifyEditorContent,
} from '@/features/editor/lib/editor-serializer'

type SharedAccess = {
  shareId: string
  guestId: string
  guestName: string
}

type Props = {
  documentId: string
  initialContent: string
  sharedAccess?: SharedAccess
  onUpdate?: (content: string) => void
}

const AI_LOADING_TEXT = 'AI 생성 중...'

function extractAICommand(editor: Editor) {
  const { $from } = editor.state.selection
  const parent = $from.parent
  const parentStart = $from.start()

  const textBeforeCursor = parent.textBetween(
    0,
    $from.parentOffset,
    '\n',
    '\n',
  )

  const match = textBeforeCursor.match(
    /(?:^|\s)(\/ai\s+.+)$/,
  )

  if (!match) {
    return null
  }

  const fullCommand = match[1]

  const promptMatch = fullCommand.match(
    /^\/ai\s+(.+)$/,
  )

  if (!promptMatch) {
    return null
  }

  const commandStartOffset =
    textBeforeCursor.lastIndexOf(fullCommand)

  return {
    prompt: promptMatch[1].trim(),
    from: parentStart + commandStartOffset,
    to: parentStart + $from.parentOffset,
  }
}

async function saveDocumentImmediately(
  documentId: string,
  content: string,
  sharedAccess?: SharedAccess,
) {
  const res = await fetch(
    `/api/documents/${documentId}/autosave`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        shareId: sharedAccess?.shareId,
      }),
    },
  )

  if (!res.ok) {
    const data = await res.json().catch(() => null)

    throw new Error(
      data?.message ?? '즉시 저장에 실패했습니다.',
    )
  }
}

async function runAI(
  editor: Editor,
  documentId: string,
  prompt: string,
  commandFrom: number,
  commandTo: number,
  sharedAccess?: SharedAccess,
) {
  const insertFrom = commandFrom

  editor
    .chain()
    .focus()
    .deleteRange({
      from: commandFrom,
      to: commandTo,
    })
    .insertContentAt(
      commandFrom,
      AI_LOADING_TEXT,
    )
    .run()

  try {
    const res = await fetch('/api/ai/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        prompt,
        content: editor.getText(),
        shareId: sharedAccess?.shareId,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)

      throw new Error(
        data?.message ?? 'AI 요청 실패',
      )
    }

    if (!res.body) {
      throw new Error(
        'AI 응답이 비어 있습니다.',
      )
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    let result = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      result += decoder.decode(value, {
        stream: true,
      })
    }

    const docText = editor.state.doc.textBetween(
      0,
      editor.state.doc.content.size,
      '\n',
      '\n',
    )

    const loadingOffset =
      docText.indexOf(AI_LOADING_TEXT)

    const replaceFrom =
      loadingOffset >= 0
        ? loadingOffset + 1
        : insertFrom

    editor
      .chain()
      .focus()
      .deleteRange({
        from: replaceFrom,
        to:
          replaceFrom +
          AI_LOADING_TEXT.length,
      })
      .insertContentAt(
        replaceFrom,
        result.trim(),
      )
      .run()

    await saveDocumentImmediately(
      documentId,
      stringifyEditorContent(
        editor.getJSON(),
      ),
      sharedAccess,
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? `AI 생성 실패: ${error.message}`
        : 'AI 생성 실패'

    editor
      .chain()
      .focus()
      .insertContent(message)
      .run()
  }
}

export function useEditorInstance({
  documentId,
  initialContent,
  sharedAccess,
  onUpdate,
}: Props) {
  const initializedRef = useRef(false)
  const editorRef = useRef<Editor | null>(null)

  const {
    provider,
    ydoc,
  } = useDocumentCollaboration()

  const extensions = useMemo(() => {
    return createTiptapExtensions({
      ydoc,
      field: 'body',
      placeholder:
        '문서를 입력하거나 /ai 로 AI에게 요청하세요...',
      enableAI: true,
    }) as any[]
  }, [ydoc])

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      editable: true,

      editorProps: {
        attributes: {
          class:
            'min-h-[460px] rounded-xl p-4 outline-none prose prose-sm max-w-none',
        },

        handleKeyDown(_view, event) {
          const currentEditor =
            editorRef.current

          if (!currentEditor) {
            return false
          }

          if (
            event.key !== 'Enter' ||
            event.shiftKey ||
            event.isComposing
          ) {
            return false
          }

          const command =
            extractAICommand(currentEditor)

          if (!command) {
            return false
          }

          event.preventDefault()

          void runAI(
            currentEditor,
            documentId,
            command.prompt,
            command.from,
            command.to,
            sharedAccess,
          )

          return true
        },
      },

      onUpdate({ editor }) {
        onUpdate?.(
          stringifyEditorContent(
            editor.getJSON(),
          ),
        )
      },
    },
    [ydoc],
  )

  useAwarenessCursor({
    editor,
    provider,
    field: 'body',
  })

  useEffect(() => {
    editorRef.current = editor

    return () => {
      if (editorRef.current === editor) {
        editorRef.current = null
      }
    }
  }, [editor])

  useEffect(() => {
    initializedRef.current = false
  }, [documentId])

  useEffect(() => {
    if (!editor) {
      return
    }

    if (initializedRef.current) {
      return
    }

    initializedRef.current = true

    /*
     * provider 동기화가 끝난 후 에디터가 마운트되므로
     * Yjs body가 비어 있을 때만 DB 본문을 초기값으로 사용한다.
     */
    if (!editor.isEmpty || !initialContent) {
      return
    }

    editor.commands.setContent(
      parseEditorContent(initialContent),
      {
        emitUpdate: true,
      },
    )
  }, [
    editor,
    documentId,
    initialContent,
  ])

  return {
    editor,
    provider,
  }
}