'use client'

import { useState } from 'react'
import { useShareDocument } from '@/features/documents/hooks/use-share-document'

type Props = {
  documentId: string
}

export function ShareButton({ documentId }: Props) {
  const { mutateAsync, isPending } = useShareDocument(documentId)
  const [open, setOpen] = useState(false)
  const [shareCanEdit, setShareCanEdit] = useState(false)

  async function handleCreate() {
    try {
      const res = await mutateAsync({ shareCanEdit })
      await navigator.clipboard.writeText(res.shareUrl)
      alert(
        `${shareCanEdit ? '편집 가능' : '보기 전용'} 링크가 복사되었습니다.\n${res.shareUrl}`,
      )
      setOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : '공유 링크 생성 실패')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        공유 링크 만들기
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">공유 링크 만들기</h3>
            <p className="mt-2 text-sm text-gray-500">
              보기 전용 또는 편집 가능한 링크를 생성할 수 있습니다.
            </p>

            <label className="mt-4 flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={shareCanEdit}
                onChange={(e) => setShareCanEdit(e.target.checked)}
              />
              편집 가능한 링크로 만들기
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
              >
                {isPending ? '생성 중...' : '링크 생성'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}