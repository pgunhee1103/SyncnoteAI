'use client'

import { useDocumentsQuery } from '@/features/documents/hooks/use-documents-query'
import { DocumentListItemRow } from '@/features/documents/components/document-list-item'

export function DocumentList() {
  const { data, isLoading, error } = useDocumentsQuery()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
        <p className="text-sm font-medium text-red-600">
          문서 목록을 불러오지 못했습니다.
        </p>
        <p className="mt-1 text-sm text-red-500">
          {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
        </p>
      </div>
    )
  }

  if (!data?.documents.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-700">아직 문서가 없습니다.</p>
        <p className="mt-2 text-sm text-gray-500">
          오른쪽 위의 새 문서 만들기 버튼으로 첫 문서를 시작해보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.documents.map((document) => (
        <DocumentListItemRow key={document.id} document={document} />
      ))}
    </div>
  )
}