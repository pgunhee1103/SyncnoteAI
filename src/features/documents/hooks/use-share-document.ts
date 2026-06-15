'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import { queryKeys } from '@/lib/react-query/query-keys'
import type { ShareDocumentResponse } from '@/features/documents/types'

type SharePayload = {
  shareCanEdit: boolean
}

export function useShareDocument(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SharePayload) =>
      fetcher<ShareDocumentResponse>(`/api/documents/${documentId}/share`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentMeta(documentId),
      })
    },
  })
}