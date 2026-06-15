'use client'

import { useEffect, useRef, useState } from 'react'
import { useDebounce } from '@/shared/hooks/use-debounce'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type SharedAccess = {
  shareId: string
  guestId: string
  guestName: string
}

type Props = {
  documentId: string
  content: string
  initialContent: string
  sharedAccess?: SharedAccess
  onSaved?: (savedContent: string) => void
}

export function useAutosave({
  documentId,
  content,
  initialContent,
  sharedAccess,
  onSaved,
}: Props) {
  const debouncedContent = useDebounce(content, 1000)
  const [status, setStatus] = useState<SaveStatus>('saved')

  const hasMountedRef = useRef(false)
  const lastSavedContentRef = useRef(initialContent)

  useEffect(() => {
    lastSavedContentRef.current = initialContent
    setStatus('saved')
  }, [initialContent])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (!documentId) {
      return
    }

    if (debouncedContent === lastSavedContentRef.current) {
      return
    }

    let cancelled = false

    async function save() {
      try {
        setStatus('saving')

        const res = await fetch(`/api/documents/${documentId}/autosave`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: debouncedContent,
            shareId: sharedAccess?.shareId,
          }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.message ?? '자동 저장 실패')
        }

        if (!cancelled) {
          lastSavedContentRef.current = debouncedContent
          onSaved?.(debouncedContent)
          setStatus('saved')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('autosave error:', error)
          setStatus('error')
        }
      }
    }

    void save()

    return () => {
      cancelled = true
    }
  }, [debouncedContent, documentId, onSaved, sharedAccess])

  return status
}