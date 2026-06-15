export type DocumentListItem = {
  id: string
  title: string
  ownerId: string
  isPublic: boolean
  shareId: string | null
  shareCanEdit: boolean
  createdAt: string
  updatedAt: string
}

export type DocumentDetail = {
  id: string
  title: string
  content: string
  ownerId: string
  isPublic: boolean
  shareId: string | null
  shareCanEdit: boolean
  createdAt: string
  updatedAt: string
}

export type CreateDocumentResponse = {
  message: string
  document: DocumentDetail
}

export type DocumentsResponse = {
  documents: DocumentListItem[]
}

export type DocumentResponse = {
  document: DocumentDetail
}

export type UpdateTitleResponse = {
  message: string
  document: DocumentDetail
}

export type ShareDocumentResponse = {
  message: string
  document: DocumentDetail
  shareUrl: string
}