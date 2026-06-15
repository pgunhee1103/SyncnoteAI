'use client'

import { useEffect, useMemo, useState } from 'react'
import { DocumentHeader } from '@/features/documents/components/document-header'
import { EditorShell } from '@/features/editor/components/editor-shell'

type Props = {
  documentId: string
  title: string
  content: string
  shareId: string
}

function getGuestIdentity() {
  const storedId = window.localStorage.getItem('syncnote_guest_id')
  const storedName = window.localStorage.getItem('syncnote_guest_name')

  if (storedId && storedName) {
    return {
      guestId: storedId,
      guestName: storedName,
    }
  }

  const guestId = crypto.randomUUID()
  const guestName = `Guest-${Math.floor(Math.random() * 900 + 100)}`

  window.localStorage.setItem('syncnote_guest_id', guestId)
  window.localStorage.setItem('syncnote_guest_name', guestName)

  return {
    guestId,
    guestName,
  }
}

export function SharedDocumentEditorPage({
  documentId,
  title,
  content,
  shareId,
}: Props) {
  const [guestReady, setGuestReady] = useState(false)
  const [guestId, setGuestId] = useState('')
  const [guestName, setGuestName] = useState('')

  useEffect(() => {
    const guest = getGuestIdentity()
    setGuestId(guest.guestId)
    setGuestName(guest.guestName)
    setGuestReady(true)
  }, [])

  const sharedAccess = useMemo(() => {
    if (!guestReady) return undefined

    return {
      shareId,
      guestId,
      guestName,
    }
  }, [guestReady, shareId, guestId, guestName])

  if (!guestReady || !sharedAccess) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">협업 편집 환경을 준비하는 중...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <DocumentHeader
          documentId={documentId}
          title={title}
          shareId={shareId}
          showOwnerActions={false}
        />
        <p className="mt-2 text-sm text-gray-500">
          편집 가능한 공유 링크입니다. 현재 이름: {guestName}
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <EditorShell
          documentId={documentId}
          initialContent={content}
          documentTitle={title}
          sharedAccess={sharedAccess}
        />
      </section>
    </main>
  )
}