'use client'

import Link from 'next/link'
import type { DocumentListItem } from '@/features/documents/types'

type Props = {
  document: DocumentListItem
}

export function DocumentListItemRow({ document }: Props) {
  return (
    <Link
      href={`/documents/${document.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-gray-900">
            {document.title || 'Untitled'}
          </h2>
          {/* <p className="text-xs text-gray-500">문서 ID: {document.id}</p> */}
        </div>

        <span className="text-xs text-gray-500">
          {new Date(document.updatedAt).toLocaleString()}
        </span>
      </div>
    </Link>
  )
}