import { prisma } from '@/server/db/prisma'

export async function createDocumentRecord(ownerId: string) {
  return prisma.document.create({
    data: {
      ownerId,
      title: 'Untitled',
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }),
    },
  })
}

export async function findDocumentsByOwner(ownerId: string) {
  return prisma.document.findMany({
    where: { ownerId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function findDocumentById(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
  })
}

export async function updateDocumentTitleRecord(
  documentId: string,
  title: string,
) {
  return prisma.document.update({
    where: { id: documentId },
    data: { title },
  })
}

export async function updateDocumentContentRecord(
  documentId: string,
  content: string,
  title?: string,
) {
  return prisma.document.update({
    where: { id: documentId },
    data: {
      content,
      ...(title ? { title } : {}),
    },
  })
}

export async function updateDocumentShareRecord(
  documentId: string,
  shareId: string,
  shareCanEdit: boolean,
) {
  return prisma.document.update({
    where: { id: documentId },
    data: {
      isPublic: true,
      shareId,
      shareCanEdit,
    },
  })
}

export async function deleteDocumentRecord(documentId: string) {
  return prisma.document.delete({
    where: { id: documentId },
  })
}

export async function findPublicDocumentByShareId(shareId: string) {
  return prisma.document.findFirst({
    where: {
      shareId,
      isPublic: true,
    },
  })
}