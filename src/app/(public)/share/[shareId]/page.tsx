import { notFound } from 'next/navigation'
import { getSharedDocumentByShareId } from '@/features/documents/server/documents.service'
import { SharedDocumentView } from '@/features/share/components/shared-document-view'
import { SharedDocumentEditorPage } from '@/features/share/components/shared-document-editor-page'

type Props = {
  params: Promise<{ shareId: string }>
}

export default async function SharedDocumentPage({ params }: Props) {
  const { shareId } = await params

  try {
    const document = await getSharedDocumentByShareId(shareId)

    if (document.shareCanEdit) {
      return (
        <SharedDocumentEditorPage
          documentId={document.id}
          title={document.title}
          content={document.content}
          shareId={shareId}
        />
      )
    }

    return (
      <SharedDocumentView
        title={document.title}
        content={document.content}
        updatedAt={document.updatedAt}
      />
    )
  } catch {
    notFound()
  }
}