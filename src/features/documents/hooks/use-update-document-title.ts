'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import { queryKeys } from '@/lib/react-query/query-keys'
import type { UpdateTitleResponse } from '@/features/documents/types'

export function useUpdateDocumentTitle(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (title: string) =>
      fetcher<UpdateTitleResponse>(`/api/documents/${documentId}/title`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentMeta(documentId),
      })
    },
  })
}