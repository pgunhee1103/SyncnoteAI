'use client'

import { useRouter } from 'next/navigation'
import { useCreateDocument } from '@/features/documents/hooks/use-create-document'

export function CreateDocumentButton() {
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateDocument()

  async function handleClick() {
    try {
      const res = await mutateAsync()
      router.push(`/documents/${res.document.id}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : '문서 생성 실패')
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
    >
      {isPending ? '생성 중...' : '새 문서 만들기'}
    </button>
  )
}