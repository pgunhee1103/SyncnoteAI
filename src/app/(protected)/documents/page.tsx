import { CreateDocumentButton } from '@/features/documents/components/create-document-button'
import { DocumentList } from '@/features/documents/components/document-list'

export default function DocumentsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">내 문서</h1>
          {/* <p className="text-sm text-gray-500">
            실시간 협업과 AI 초안 생성을 지원하는 문서 작업 공간입니다.
          </p> */}
        </div>

        <CreateDocumentButton />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <DocumentList />
      </section>
    </main>
  )
}