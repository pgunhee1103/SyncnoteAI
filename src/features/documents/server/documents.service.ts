import { randomBytes } from 'node:crypto'
import {
  createDocumentRecord,
  deleteDocumentRecord,
  findDocumentById,
  findDocumentsByOwner,
  findPublicDocumentByShareId,
  updateDocumentContentRecord,
  updateDocumentShareRecord,
  updateDocumentTitleRecord,
} from '@/features/documents/server/documents.repository'
import type {
  DocumentDetail,
  DocumentListItem,
} from '@/features/documents/types'

function serializeDocument<T extends { createdAt: Date; updatedAt: Date }>(
  document: T,
) {
  return {
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  }
}

function deriveTitleFromContent(content: string) {
  try {
    const parsed = JSON.parse(content)

    function extractText(node: unknown): string[] {
      if (!node || typeof node !== 'object') return []

      const obj = node as {
        type?: string
        text?: string
        content?: unknown[]
      }

      const parts: string[] = []

      if (obj.type === 'text' && typeof obj.text === 'string') {
        parts.push(obj.text)
      }

      if (Array.isArray(obj.content)) {
        for (const child of obj.content) {
          parts.push(...extractText(child))
        }
      }

      return parts
    }

    const text = extractText(parsed)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) return 'Untitled'

    return text.slice(0, 10)
  } catch {
    return 'Untitled'
  }
}

export async function createDocument(ownerId: string): Promise<DocumentDetail> {
  const document = await createDocumentRecord(ownerId)
  return serializeDocument(document)
}

export async function getMyDocuments(
  ownerId: string,
): Promise<DocumentListItem[]> {
  const documents = await findDocumentsByOwner(ownerId)
  return documents.map(serializeDocument)
}

export async function getDocumentByIdForUser(
  documentId: string,
  userId: string,
): Promise<DocumentDetail> {
  const document = await findDocumentById(documentId)

  if (!document) throw new Error('NOT_FOUND')
  if (document.ownerId !== userId) throw new Error('FORBIDDEN')

  return serializeDocument(document)
}

export async function updateDocumentTitleForUser(
  documentId: string,
  userId: string | null,
  shareId: string | undefined,
  title: string,
): Promise<DocumentDetail> {
  const document = await findDocumentById(documentId)

  if (!document) throw new Error('NOT_FOUND')

  const isOwner = !!userId && document.ownerId === userId
  const isSharedEditor =
    !!shareId && document.shareId === shareId && document.shareCanEdit

  if (!isOwner && !isSharedEditor) {
    throw new Error('FORBIDDEN')
  }

  const safeTitle = title.trim() || 'Untitled'
  const updated = await updateDocumentTitleRecord(documentId, safeTitle)
  return serializeDocument(updated)
}

export async function autosaveDocumentForUser(
  documentId: string,
  userId: string,
  content: string,
): Promise<DocumentDetail> {
  const document = await findDocumentById(documentId)

  if (!document) throw new Error('NOT_FOUND')
  if (document.ownerId !== userId) throw new Error('FORBIDDEN')

  let title = document.title
  if (!title || title === 'Untitled') {
    title = deriveTitleFromContent(content)
  }

  const updated = await updateDocumentContentRecord(documentId, content, title)
  return serializeDocument(updated)
}

export async function autosaveDocumentForSharedLink(
  documentId: string,
  shareId: string,
  content: string,
): Promise<DocumentDetail> {
  const document = await findDocumentById(documentId)

  if (!document) throw new Error('NOT_FOUND')
  if (!document.shareId || document.shareId !== shareId) {
    throw new Error('FORBIDDEN')
  }
  if (!document.shareCanEdit) {
    throw new Error('FORBIDDEN')
  }

  let title = document.title
  if (!title || title === 'Untitled') {
    title = deriveTitleFromContent(content)
  }

  const updated = await updateDocumentContentRecord(documentId, content, title)
  return serializeDocument(updated)
}

export async function createShareLinkForUser(
  documentId: string,
  userId: string,
  shareCanEdit: boolean,
): Promise<DocumentDetail> {
  const document = await findDocumentById(documentId)

  if (!document) throw new Error('NOT_FOUND')
  if (document.ownerId !== userId) throw new Error('FORBIDDEN')

  const shareId = document.shareId ?? randomBytes(12).toString('hex')
  const updated = await updateDocumentShareRecord(
    documentId,
    shareId,
    shareCanEdit,
  )

  return serializeDocument(updated)
}

export async function deleteDocumentForUser(
  documentId: string,
  userId: string,
) {
  const document = await findDocumentById(documentId)

  if (!document) throw new Error('NOT_FOUND')
  if (document.ownerId !== userId) throw new Error('FORBIDDEN')

  await deleteDocumentRecord(documentId)

  return { id: documentId }
}

export async function getSharedDocumentByShareId(
  shareId: string,
): Promise<DocumentDetail> {
  const document = await findPublicDocumentByShareId(shareId)

  if (!document) throw new Error('NOT_FOUND')

  return serializeDocument(document)
}