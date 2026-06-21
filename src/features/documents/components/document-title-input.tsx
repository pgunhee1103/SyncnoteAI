'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  EditorContent,
  useEditor,
} from '@tiptap/react'
import { createTiptapExtensions } from '@/features/editor/lib/tiptap-extensions'
import { useDocumentCollaboration } from '@/features/collaboration/components/document-collaboration-provider'
import { useAwarenessCursor } from '@/features/editor/hooks/use-awareness-cursor'
import { AwarenessCursors } from '@/features/editor/components/awareness-cursors'

type Props = {
  documentId: string
  title: string
  shareId?: string
  onTitleSaved: (title: string) => void
}

function normalizeTitle(value: string): string {
  return (
    value
      .replace(/\n/g, ' ')
      .trim() || 'Untitled'
  )
}

function titleToContent(title: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: normalizeTitle(title),
          },
        ],
      },
    ],
  }
}

export function DocumentTitleInput({
  documentId,
  title,
  shareId,
  onTitleSaved,
}: Props) {
  const initialTitle = normalizeTitle(title)

  const [currentTitle, setCurrentTitle] =
    useState(initialTitle)

  const initializedRef = useRef(false)

  const currentTitleRef =
    useRef(initialTitle)

  const lastPersistedTitleRef =
    useRef(initialTitle)

  const saveInFlightRef =
    useRef(false)

  const {
    provider,
    ydoc,
  } = useDocumentCollaboration()

  const extensions = useMemo(() => {
    return createTiptapExtensions({
      ydoc,
      field: 'title',
      placeholder: '제목 입력',
      enableAI: false,
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
            'min-h-[48px] rounded-xl border border-transparent bg-transparent px-1 py-2 text-3xl font-bold tracking-tight text-gray-900 outline-none transition focus:border-gray-200 focus:bg-gray-50',
        },

        handleKeyDown(_view, event) {
          if (event.key === 'Enter') {
            event.preventDefault()
            return true
          }

          return false
        },
      },

      onUpdate({ editor }) {
        const nextTitle = normalizeTitle(
          editor.getText(),
        )

        currentTitleRef.current =
          nextTitle

        setCurrentTitle(nextTitle)
        onTitleSaved(nextTitle)
      },
    },
    [ydoc],
  )

  useAwarenessCursor({
    editor,
    provider,
    field: 'title',
  })

  useEffect(() => {
    initializedRef.current = false

    const nextInitialTitle =
      normalizeTitle(title)

    currentTitleRef.current =
      nextInitialTitle

    lastPersistedTitleRef.current =
      nextInitialTitle

    saveInFlightRef.current = false
    setCurrentTitle(nextInitialTitle)
  }, [documentId])

  useEffect(() => {
    if (!editor) {
      return
    }

    if (initializedRef.current) {
      return
    }

    initializedRef.current = true

    if (!editor.isEmpty) {
      return
    }

    editor.commands.setContent(
      titleToContent(title),
      {
        emitUpdate: true,
      },
    )
  }, [
    editor,
    documentId,
    title,
  ])

  const persistLatestTitle =
    useCallback(async () => {
      if (saveInFlightRef.current) {
        return
      }

      saveInFlightRef.current = true

      try {
        while (true) {
          const titleToSave =
            normalizeTitle(
              currentTitleRef.current,
            )

          if (
            titleToSave ===
            lastPersistedTitleRef.current
          ) {
            break
          }

          const res = await fetch(
            `/api/documents/${documentId}/title`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type':
                  'application/json',
                ...(shareId
                  ? {
                      'x-share-id': shareId,
                    }
                  : {}),
              },
              body: JSON.stringify({
                title: titleToSave,
              }),
            },
          )

          const data = await res
            .json()
            .catch(() => null)

          if (!res.ok) {
            throw new Error(
              data?.message ??
                '제목 수정 실패',
            )
          }

          lastPersistedTitleRef.current =
            titleToSave

          if (
            normalizeTitle(
              currentTitleRef.current,
            ) ===
            lastPersistedTitleRef.current
          ) {
            break
          }
        }
      } catch (error) {
        console.error(
          'title autosave error:',
          error,
        )
      } finally {
        saveInFlightRef.current = false
      }
    }, [documentId, shareId])

  useEffect(() => {
    if (!editor) {
      return
    }

    if (
      currentTitle ===
      lastPersistedTitleRef.current
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      void persistLatestTitle()
    }, 700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    editor,
    currentTitle,
    persistLatestTitle,
  ])

  if (!editor) {
    return (
      <div className="h-[64px] animate-pulse rounded-xl bg-gray-100" />
    )
  }

  return (
    <div className="relative">
      <AwarenessCursors
        editor={editor}
        provider={provider}
        field="title"
      />

      <EditorContent editor={editor} />
    </div>
  )
}