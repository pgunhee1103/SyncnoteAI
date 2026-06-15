'use client'

import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import { queryKeys } from '@/lib/react-query/query-keys'
import type { DocumentResponse } from '@/features/documents/types'

export function useDocumentMetaQuery(documentId: string) {
  return useQuery({
    queryKey: queryKeys.documentMeta(documentId),
    queryFn: () => fetcher<DocumentResponse>(`/api/documents/${documentId}`),
    enabled: Boolean(documentId),
  })
}