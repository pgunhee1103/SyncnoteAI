// export type CollaboratorPresence = {
//   userId: string
//   displayName: string
//   documentId: string
//   socketId: string
//   color: string

//   bodyCursorPosition?: number | null
//   bodyCursorVisible?: boolean

//   titleCursorIndex?: number | null
//   titleEditing?: boolean
// }

// export type JoinDocumentPayload = {
//   documentId: string
//   shareId?: string
//   guestId?: string
//   guestName?: string
// }

// export type DocumentUpdatePayload = {
//   documentId: string
//   content: string
// }

// export type BodyCursorUpdatePayload = {
//   documentId: string
//   position: number | null
//   visible: boolean
// }

// export type TitleUpdatePayload = {
//   documentId: string
//   title: string
//   sourceSocketId?: string
// }

// export type TitleCursorUpdatePayload = {
//   documentId: string
//   index: number | null
//   visible: boolean
// }

// export type PresenceUpdatePayload = {
//   documentId: string
//   users: CollaboratorPresence[]
// }

// export type RemoteDocumentSyncPayload = {
//   documentId: string
//   content: string
//   sourceSocketId: string
// }

export type JoinDocumentPayload = {
  documentId: string
  shareId?: string
  guestId?: string
  guestName?: string
}