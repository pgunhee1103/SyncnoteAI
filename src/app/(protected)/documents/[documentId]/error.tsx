'use client'

export default function ErrorDocumentPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-600">
          문서를 불러오는 중 오류가 발생했습니다.
        </h2>
        <p className="mt-2 text-sm text-red-500">
          잠시 후 다시 시도해주세요. 문제가 계속되면 새로고침해보세요.
        </p>
      </div>
    </main>
  )
}