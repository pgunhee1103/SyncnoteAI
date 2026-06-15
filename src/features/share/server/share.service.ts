import { getSharedDocumentByShareId } from '@/features/documents/server/documents.service'

export async function getSharedDocument(shareId: string) {
  return getSharedDocumentByShareId(shareId)
}