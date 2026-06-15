//삭제
// 'use client'

// import { useEffect, useMemo, useState } from 'react'
// import { getSocket } from '@/lib/socket/socket-client'
// import type { CollaboratorPresence } from '@/features/collaboration/types'

// type Props = {
//   users: CollaboratorPresence[]
//   title: string
//   inputRef: React.RefObject<HTMLInputElement | null>
// }

// function buildMirrorStyle(input: HTMLInputElement) {
//   const style = window.getComputedStyle(input)

//   return {
//     fontFamily: style.fontFamily,
//     fontSize: style.fontSize,
//     fontWeight: style.fontWeight,
//     fontStyle: style.fontStyle,
//     letterSpacing: style.letterSpacing,
//     textTransform: style.textTransform,
//     whiteSpace: 'pre',
//   } as const
// }

// export function DocumentTitleCursors({ users, title, inputRef }: Props) {
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

//   const items = useMemo(() => {
//     const input = inputRef.current
//     if (!input) return []

//     const style = window.getComputedStyle(input)
//     const paddingLeft = Number.parseFloat(style.paddingLeft || '0') || 0
//     const borderLeftWidth = Number.parseFloat(style.borderLeftWidth || '0') || 0
//     const lineHeight =
//       style.lineHeight === 'normal'
//         ? (Number.parseFloat(style.fontSize || '16') || 16) * 1.2
//         : Number.parseFloat(style.lineHeight || '0') || 0

//     const inputHeight = input.clientHeight
//     const cursorHeight = Math.max(18, lineHeight || inputHeight * 0.7)
//     const top = (inputHeight - cursorHeight) / 2

//     const mirror = document.createElement('span')
//     const mirrorStyle = buildMirrorStyle(input)

//     Object.assign(mirror.style, mirrorStyle, {
//       position: 'absolute',
//       visibility: 'hidden',
//       left: '-9999px',
//       top: '-9999px',
//       pointerEvents: 'none',
//     })

//     document.body.appendChild(mirror)

//     const result = users
//       .filter((user) => user.socketId !== mySocketId)
//       .filter((user) => user.titleEditing)
//       .filter((user) => typeof user.titleCursorIndex === 'number')
//       .map((user) => {
//         const index = Math.max(
//           0,
//           Math.min(user.titleCursorIndex as number, title.length),
//         )

//         const prefix = title.slice(0, index) || ''
//         mirror.textContent = prefix.replace(/ /g, '\u00A0')

//         const textWidth = mirror.getBoundingClientRect().width

//         return {
//           socketId: user.socketId,
//           displayName: user.displayName,
//           color: user.color,
//           left: borderLeftWidth + paddingLeft + textWidth,
//           top,
//           height: cursorHeight,
//         }
//       })

//     document.body.removeChild(mirror)

//     return result
//   }, [users, title, inputRef, mySocketId])

//   if (!inputRef.current) return null

//   return (
//     <>
//       {items.map((item) => (
//         <div
//           key={item.socketId}
//           className="pointer-events-none absolute z-20"
//           style={{
//             left: item.left,
//             top: item.top,
//           }}
//         >
//           <div
//             style={{
//               width: 2,
//               height: item.height,
//               backgroundColor: item.color,
//               borderRadius: 9999,
//             }}
//           />
//           <div
//             className="absolute left-1 rounded px-2 py-0.5 text-[11px] font-medium text-white shadow"
//             style={{
//               backgroundColor: item.color,
//               top: -22,
//             }}
//           >
//             {item.displayName}
//           </div>
//         </div>
//       ))}
//     </>
//   )
// }