'use client'

import { ReadonlyTiptapViewer } from '@/features/editor/components/readonly-tiptap-viewer'

type Props = {
  title: string
  content: string
  updatedAt?: string
}

export function SharedDocumentView({ title, content, updatedAt }: Props) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
        {updatedAt ? (
          <p className="mt-2 text-sm text-gray-500">
            마지막 수정: {new Date(updatedAt).toLocaleString()}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-gray-500">
          보기 전용 공유 링크입니다.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ReadonlyTiptapViewer content={content} />
      </section>
    </main>
  )
}