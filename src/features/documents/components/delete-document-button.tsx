'use client'

import { useRouter } from 'next/navigation'
import { useDeleteDocument } from '@/features/documents/hooks/use-delete-document'

type Props = {
  documentId: string
}

export function DeleteDocumentButton({ documentId }: Props) {
  const router = useRouter()
  const { mutateAsync, isPending } = useDeleteDocument(documentId)

  async function handleDelete() {
    const confirmed = window.confirm('이 문서를 삭제할까요?')

    if (!confirmed) {
      return
    }

    try {
      await mutateAsync()
      router.push('/documents')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : '문서 삭제 실패')
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? '삭제 중...' : '문서 삭제'}
    </button>
  )
}