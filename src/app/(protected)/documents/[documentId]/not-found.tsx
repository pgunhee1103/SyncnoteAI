export default function NotFoundDocumentPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          문서를 찾을 수 없습니다.
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          삭제되었거나 접근 권한이 없는 문서일 수 있습니다.
        </p>
      </div>
    </main>
  )
}