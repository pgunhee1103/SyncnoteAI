//삭제
// 'use client'

// import { useEffect, useMemo, useState } from 'react'
// import type { Editor } from '@tiptap/react'
// import { getSocket } from '@/lib/socket/socket-client'
// import type { CollaboratorPresence } from '@/features/collaboration/types'

// type Props = {
//   editor: Editor | null
//   users: CollaboratorPresence[]
// }

// export function CollaborativeCursors({ editor, users }: Props) {
//   const [mySocketId, setMySocketId] = useState<string | null>(null)

//   useEffect(() => {
//     const socket = getSocket()

//     function syncSocketId() {
//       setMySocketId(socket.id ?? null)
//     }

//     syncSocketId()
//     socket.on('connect', syncSocketId)

//     return () => {
//       socket.off('connect', syncSocketId)
//     }
//   }, [])

// const cursorItems = useMemo(() => {
//   if (!editor) return []

//   const editorRect = editor.view.dom.getBoundingClientRect()

//   return users
//     .filter((user) => user.socketId !== mySocketId)
//     .filter((user) => user.bodyCursorVisible)
//     .filter((user) => typeof user.bodyCursorPosition === 'number')
//     .map((user) => {
//       try {
//         const pos = user.bodyCursorPosition as number

//         const docSize = editor.state.doc.content.size

//         const safePos = Math.max(
//           1,
//           Math.min(pos, docSize)
//         )

//         const coords = editor.view.coordsAtPos(safePos)

//         const height = Math.max(
//           18,
//           coords.bottom - coords.top
//         )

//         return {
//           socketId: user.socketId,
//           displayName: user.displayName,
//           color: user.color,
//           left: coords.left - editorRect.left,
//           top: coords.top - editorRect.top,
//           height,
//         }
//       } catch {
//         return null
//       }
//     })
//     .filter(Boolean) as Array<{
//       socketId: string
//       displayName: string
//       color: string
//       left: number
//       top: number
//       height: number
//     }>
// }, [editor, users, mySocketId])

//   if (!editor) return null

//   // return (
//   //   <>
//   //     {cursorItems.map((item) => (
//   //         console.log(
//   //   "DRAW",
//   //   item.displayName,
//   //   item.left,
//   //   item.top
//   // )
  
//   //       <div
//   //         key={item.socketId}
//   //         className="pointer-events-none absolute z-20"
//   //         style={{
//   //           left: item.left,
//   //           top: item.top,
//   //         }}
//   //       >
//   //         <div
//   //           style={{
//   //             width: 2,
//   //             height: item.height,
//   //             backgroundColor: item.color,
//   //             borderRadius: 9999,
//   //           }}
//   //         />
//   //         <div
//   //           className="absolute left-1 rounded px-2 py-0.5 text-[11px] font-medium text-white shadow"
//   //           style={{
//   //             backgroundColor: item.color,
//   //             top: -22,
//   //           }}
//   //         >
//   //           {item.displayName}
//   //         </div>
//   //       </div>
//   //     ))}
//   //   </>
//   // )
//   return (
//   <>
//   {cursorItems.map((item) => {
//     console.log(
//       "DRAW",
//       item.displayName,
//       item.left,
//       item.top
//     )

//     return (
//       <div
//         key={item.socketId}
//         className="pointer-events-none absolute z-20"
//         style={{
//           left: item.left,
//           top: item.top,
//         }}
//       >
//         <div
//           style={{
//             width: 2,
//             height: item.height,
//             backgroundColor: item.color,
//             borderRadius: 9999,
//           }}
//         />
//         <div
//           className="absolute left-1 rounded px-2 py-0.5 text-[11px] font-medium text-white shadow"
//           style={{
//             backgroundColor: item.color,
//             top: -22,
//           }}
//         >
//           {item.displayName}
//         </div>
//       </div>
//     )
//   })}
// </>
//   )
// }