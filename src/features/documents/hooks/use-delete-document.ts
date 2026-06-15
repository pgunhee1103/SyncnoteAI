'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query/query-keys'

type DeleteDocumentResponse = {
  message: string
  deleted: {
    id: string
  }
}

export function useDeleteDocument(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message ?? '문서 삭제에 실패했습니다.')
      }

      return data as DeleteDocumentResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
      queryClient.removeQueries({
        queryKey: queryKeys.documentMeta(documentId),
      })
    },
  })
}