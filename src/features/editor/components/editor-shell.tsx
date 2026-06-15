'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAutosave } from '@/features/editor/hooks/use-autosave'
import { useEditorInstance } from '@/features/editor/hooks/use-editor-instance'
import { SaveStatus } from '@/features/documents/components/save-status'
import { EditorToolbar } from '@/features/editor/components/editor-toolbar'
import { TiptapEditor } from '@/features/editor/components/tiptap-editor'
import { ImageUploadButton } from '@/features/editor/components/image-upload-button'
import { ConnectionStatus } from '@/features/collaboration/components/connection-status'
import { useConnectionStatus } from '@/features/collaboration/hooks/use-connection-status'

type SharedAccess = {
  shareId: string
  guestId: string
  guestName: string
}

type Props = {
  documentId: string
  initialContent: string
  documentTitle: string
  sharedAccess?: SharedAccess
}

export function EditorShell({
  documentId,
  initialContent,
  documentTitle: _documentTitle,
  sharedAccess,
}: Props) {
  const mountedRef = useRef(false)

  const [content, setContent] = useState(initialContent)
  const [serverContent, setServerContent] = useState(initialContent)

  const editor = useEditorInstance({
    documentId,
    initialContent: serverContent,
    sharedAccess,
    onUpdate: (nextContent) => {
      setContent(nextContent)
    },
  })

  const saveStatus = useAutosave({
    documentId,
    content,
    initialContent: serverContent,
    sharedAccess,
    onSaved: (savedContent) => {
      setServerContent(savedContent)
    },
  })

  const { phase, message } = useConnectionStatus()

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    setContent(initialContent)
    setServerContent(initialContent)
  }, [initialContent])

  const syncLatestDocument = useCallback(async () => {
    try {
      const url = sharedAccess?.shareId
        ? `/api/share/${sharedAccess.shareId}?ts=${Date.now()}`
        : `/api/documents/${documentId}?ts=${Date.now()}`

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) return

      const data = await res.json()
      const latestContent = data?.document?.content

      if (typeof latestContent !== 'string') return

      setContent(latestContent)
      setServerContent(latestContent)
    } catch (error) {
      console.error('sync latest document error:', error)
    }
  }, [documentId, sharedAccess])

  useEffect(() => {
    void syncLatestDocument()
  }, [syncLatestDocument])

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <EditorToolbar editor={editor} />
            <ImageUploadButton editor={editor} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ConnectionStatus phase={phase} message={message} />
            <SaveStatus status={saveStatus} />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          <code className="rounded bg-white px-2 py-1">/ai 요청내용</code> 입력 후 Enter로 AI 실행
        </p>
      </div>

      <TiptapEditor editor={editor} />
    </div>
  )
}