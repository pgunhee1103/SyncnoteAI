'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { DocumentHeader } from '@/features/documents/components/document-header'
import { EditorShell } from '@/features/editor/components/editor-shell'
import {
  DocumentCollaborationProvider,
  type SharedAccess,
} from '@/features/collaboration/components/document-collaboration-provider'

type Props = {
  documentId: string
  title: string
  content: string
  shareId: string
}

function getGuestIdentity() {
  const storedId =
    window.localStorage.getItem(
      'syncnote_guest_id',
    )

  const storedName =
    window.localStorage.getItem(
      'syncnote_guest_name',
    )

  if (storedId && storedName) {
    return {
      guestId: storedId,
      guestName: storedName,
    }
  }

  const guestId = crypto.randomUUID()

  const guestName =
    `Guest-${Math.floor(
      Math.random() * 900 + 100,
    )}`

  window.localStorage.setItem(
    'syncnote_guest_id',
    guestId,
  )

  window.localStorage.setItem(
    'syncnote_guest_name',
    guestName,
  )

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
  const [guestId, setGuestId] =
    useState('')

  const [guestName, setGuestName] =
    useState('')

  const [ready, setReady] =
    useState(false)

  useEffect(() => {
    const guest = getGuestIdentity()

    setGuestId(guest.guestId)
    setGuestName(guest.guestName)
    setReady(true)
  }, [])

  const sharedAccess =
    useMemo<SharedAccess | undefined>(() => {
      if (!ready) {
        return undefined
      }

      return {
        shareId,
        guestId,
        guestName,
      }
    }, [
      ready,
      shareId,
      guestId,
      guestName,
    ])

  if (!sharedAccess) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          협업 편집 환경을 준비하는 중...
        </div>
      </main>
    )
  }

  return (
    <DocumentCollaborationProvider
      key={`${documentId}:${guestId}`}
      documentId={documentId}
      user={{
        id: `guest:${guestId}`,
        name: guestName,
      }}
      sharedAccess={sharedAccess}
    >
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <DocumentHeader
            documentId={documentId}
            title={title}
            shareId={shareId}
            showOwnerActions={false}
          />
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
    </DocumentCollaborationProvider>
  )
}