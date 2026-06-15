//삭제
// 'use client'

// import { useEffect } from 'react'
// import type { Editor } from '@tiptap/react'
// import { getSocket } from '@/lib/socket/socket-client'
// import { SOCKET_EVENTS } from '@/server/socket/socket-events'

// type SharedAccess = {
//   shareId: string
//   guestId: string
//   guestName: string
// }

// type Props = {
//   documentId: string
//   editor: Editor | null
//   content: string
//   sharedAccess?: SharedAccess
// }

// export function useDocumentSocket({
//   documentId,
//   editor,
//   content: _content,
//   sharedAccess,
// }: Props) {
//   useEffect(() => {
//     const socket = getSocket()

//     socket.emit(SOCKET_EVENTS.DOCUMENT_JOIN, {
//       documentId,
//       shareId: sharedAccess?.shareId,
//       guestId: sharedAccess?.guestId,
//       guestName: sharedAccess?.guestName,
//     })

//     return () => {
//       socket.emit(SOCKET_EVENTS.DOCUMENT_LEAVE, {
//         documentId,
//       })
//     }
//   }, [documentId, sharedAccess])

//   useEffect(() => {
//     if (!editor) return

//     const socket = getSocket()

//     function emitBodyCursor() {
//       if (!editor) return
//       socket.emit(SOCKET_EVENTS.BODY_CURSOR_UPDATE, {
//         documentId,
//         position: editor.state.selection.from,
//         visible: true,
//       })

//       socket.emit(SOCKET_EVENTS.TITLE_CURSOR_UPDATE, {
//         documentId,
//         index: null,
//         visible: false,
//       })
//     }

//     function emitHiddenBodyCursor() {
//       socket.emit(SOCKET_EVENTS.BODY_CURSOR_UPDATE, {
//         documentId,
//         position: null,
//         visible: false,
//       })
//     }

//     editor.on('selectionUpdate', emitBodyCursor)
//     editor.on('focus', emitBodyCursor)
//     editor.on('blur', emitHiddenBodyCursor)

//     return () => {
//       editor.off('selectionUpdate', emitBodyCursor)
//       editor.off('focus', emitBodyCursor)
//       editor.off('blur', emitHiddenBodyCursor)
//     }
//   }, [documentId, editor])

//   return null
// }