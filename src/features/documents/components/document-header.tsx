'use client'

import { useState } from 'react'
import { DocumentTitleInput } from '@/features/documents/components/document-title-input'
import { ShareButton } from '@/features/documents/components/share-button'
import { DeleteDocumentButton } from '@/features/documents/components/delete-document-button'

type Props = {
  documentId: string
  title: string
  shareId?: string
  showOwnerActions?: boolean
}

export function DocumentHeader({
  documentId,
  title,
  shareId,
  showOwnerActions = true,
}: Props) {
  const [currentTitle, setCurrentTitle] = useState(title)

  return (
    <div className="space-y-2">
      <DocumentTitleInput
        documentId={documentId}
        title={currentTitle}
        shareId={shareId}
        onTitleSaved={setCurrentTitle}
      />

      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-gray-500">
          실시간 협업과 자동 저장이 활성화된 문서입니다.
        </p>

        {showOwnerActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <ShareButton documentId={documentId} />
            <DeleteDocumentButton documentId={documentId} />
          </div>
        ) : null}
      </div>
    </div>
  )
}