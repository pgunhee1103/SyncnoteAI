'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { createTiptapExtensions } from '@/features/editor/lib/tiptap-extensions'
import { useYjsProvider } from '@/features/editor/hooks/use-yjs-provider'
import { useAwarenessCursor } from '@/features/editor/hooks/use-awareness-cursor'
import { AwarenessCursors } from '@/features/editor/components/awareness-cursors'

type Props = {
  documentId: string
  title: string
  shareId?: string
  onTitleSaved: (title: string) => void
}

function titleToContent(title: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: title
          ? [
              {
                type: 'text',
                text: title,
              },
            ]
          : [],
      },
    ],
  }
}

function getGuestIdentity() {
  if (typeof window === 'undefined') {
    return { guestId: 'guest', guestName: 'Guest' }
  }

  const storedId = window.localStorage.getItem('syncnote_guest_id')
  const storedName = window.localStorage.getItem('syncnote_guest_name')

  if (storedId && storedName) {
    return { guestId: storedId, guestName: storedName }
  }

  const guestId = crypto.randomUUID()
  const guestName = `Guest-${Math.floor(Math.random() * 900 + 100)}`

  window.localStorage.setItem('syncnote_guest_id', guestId)
  window.localStorage.setItem('syncnote_guest_name', guestName)

  return { guestId, guestName }
}

export function DocumentTitleInput({
  documentId,
  title,
  shareId,
  onTitleSaved,
}: Props) {
  const [isSaving, setIsSaving] = useState(false)

  const hasInitializedRef = useRef(false)
  const lastSavedTitleRef = useRef(title || 'Untitled')
  const currentTitleRef = useRef(title || 'Untitled')

  const room = `document:${documentId}`

  const sharedAccess = useMemo(() => {
    if (!shareId) return undefined

    const guest = getGuestIdentity()

    return {
      shareId,
      guestId: guest.guestId,
      guestName: guest.guestName,
    }
  }, [shareId])

  const { provider, ydoc, synced } = useYjsProvider({
    room,
    documentId,
    sharedAccess,
  })

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
      editable: false,
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
        const nextTitle =
          editor.getText().replace(/\n/g, ' ').trim() || 'Untitled'

        currentTitleRef.current = nextTitle
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
    hasInitializedRef.current = false
    lastSavedTitleRef.current = title || 'Untitled'
    currentTitleRef.current = title || 'Untitled'
  }, [documentId])

  useEffect(() => {
    if (!editor) return
    if (!provider) return
    if (!synced) return

    editor.setEditable(true)
  }, [editor, provider, synced])

  useEffect(() => {
    if (!editor) return
    if (!provider) return
    if (!synced) return
    if (hasInitializedRef.current) return

    hasInitializedRef.current = true

    if (!editor.isEmpty) return

    editor.commands.setContent(titleToContent(title || 'Untitled'), {
      emitUpdate: true,
    })
  }, [editor, provider, synced, title])

  useEffect(() => {
    if (!editor) return
    if (!provider) return
    if (!synced) return

    const timer = window.setInterval(async () => {
      const nextTitle = currentTitleRef.current.trim() || 'Untitled'

      if (nextTitle === lastSavedTitleRef.current) {
        return
      }

      try {
        setIsSaving(true)

        const res = await fetch(`/api/documents/${documentId}/title`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(shareId ? { 'x-share-id': shareId } : {}),
          },
          body: JSON.stringify({ title: nextTitle }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.message ?? '제목 수정 실패')
        }

        lastSavedTitleRef.current = nextTitle
        onTitleSaved(nextTitle)
      } catch (error) {
        console.error(error)
      } finally {
        setIsSaving(false)
      }
    }, 700)

    return () => {
      window.clearInterval(timer)
    }
  }, [documentId, editor, provider, synced, shareId, onTitleSaved])

  if (!editor || !provider || !synced) {
    return <div className="h-[64px] animate-pulse rounded-xl bg-gray-100" />
  }

  return (
    <div className={isSaving ? 'relative opacity-80' : 'relative'}>
      <AwarenessCursors editor={editor} provider={provider} field="title" />
      <EditorContent editor={editor} />
    </div>
  )
}