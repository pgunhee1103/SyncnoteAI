import { getDocumentByIdForUser } from '@/features/documents/server/documents.service'

export async function requireDocumentAccess(documentId: string, userId: string) {
  return getDocumentByIdForUser(documentId, userId)
}