import {
  notFound,
  redirect,
} from 'next/navigation'
import { getCurrentUser } from '@/server/auth/current-user'
import { getDocumentByIdForUser } from '@/features/documents/server/documents.service'
import { DocumentHeader } from '@/features/documents/components/document-header'
import { EditorShell } from '@/features/editor/components/editor-shell'
import { DocumentCollaborationProvider } from '@/features/collaboration/components/document-collaboration-provider'

type Props = {
  params: Promise<{
    documentId: string
  }>
}

export default async function DocumentDetailPage({
  params,
}: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { documentId } = await params

  try {
    const document =
      await getDocumentByIdForUser(
        documentId,
        user.id,
      )

    return (
      <DocumentCollaborationProvider
        key={document.id}
        documentId={document.id}
        user={{
          id: `user:${user.id}`,
          name: user.displayName,
        }}
      >
        <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <DocumentHeader
              documentId={document.id}
              title={document.title}
            />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <EditorShell
              documentId={document.id}
              initialContent={
                document.content
              }
              documentTitle={
                document.title
              }
            />
          </section>
        </main>
      </DocumentCollaborationProvider>
    )
  } catch {
    notFound()
  }
}