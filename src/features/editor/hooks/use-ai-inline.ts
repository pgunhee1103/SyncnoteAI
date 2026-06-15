// 'use client'

// import { useEffect, useRef } from 'react'
// import type { Editor } from '@tiptap/react'

// type Props = {
//   editor: Editor | null
// }

// function extractAICommand(text: string) {
//   const lines = text.split('\n')
//   const currentLine = lines[lines.length - 1] ?? ''
//   const match = currentLine.match(/^\/ai\s+(.+)$/)

//   if (!match) {
//     return null
//   }

//   return {
//     fullMatch: currentLine,
//     prompt: match[1].trim(),
//   }
// }

// function insertResultAsParagraphs(editor: Editor, text: string) {
//   const blocks = text
//     .split(/\n{2,}/)
//     .map((part) => part.trim())
//     .filter(Boolean)
//     .map((part) => ({
//       type: 'paragraph',
//       content: [{ type: 'text', text: part }],
//     }))

//   if (blocks.length === 0) {
//     editor.chain().focus().insertContent(text).run()
//     return
//   }

//   editor.chain().focus().insertContent(blocks).run()
// }

// export function useAIInline({ editor }: Props) {
//   const runningRef = useRef(false)

//   useEffect(() => {
//     if (!editor) return

//     async function handleKeyDown(event: KeyboardEvent) {
//       if (!editor) return
//       if (event.key !== 'Enter') return
//       if (event.shiftKey) return
//       if (runningRef.current) return

//       const { state } = editor
//       const { from } = state.selection

//       const textBefore = state.doc.textBetween(0, from, '\n')
//       const command = extractAICommand(textBefore)

//       if (!command) {
//         return
//       }

//       event.preventDefault()
//       runningRef.current = true

//       const loadingText = 'AI 생성 중...'
//       let loadingInserted = false

//       try {
//         const start = from - command.fullMatch.length
//         const end = from

//         editor
//           .chain()
//           .focus()
//           .deleteRange({ from: start, to: end })
//           .insertContent({
//             type: 'paragraph',
//             content: [{ type: 'text', text: loadingText }],
//           })
//           .run()

//         loadingInserted = true

//         const res = await fetch('/api/ai/draft', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             prompt: command.prompt,
//             content: editor.getText(),
//           }),
//         })

//         if (!res.ok) {
//           const data = await res.json().catch(() => null)
//           throw new Error(data?.message ?? 'AI 요청 실패')
//         }

//         if (!res.body) {
//           throw new Error('AI 응답이 비어 있습니다.')
//         }

//         const reader = res.body.getReader()
//         const decoder = new TextDecoder()

//         let result = ''

//         while (true) {
//           const { done, value } = await reader.read()
//           if (done) break

//           result += decoder.decode(value, { stream: true })
//         }

//         if (loadingInserted) {
//           const docSize = editor.state.doc.content.size
//           const loadingBlockSize = loadingText.length + 2

//           editor
//             .chain()
//             .focus()
//             .deleteRange({
//               from: Math.max(0, docSize - loadingBlockSize),
//               to: docSize,
//             })
//             .run()
//         }

//         insertResultAsParagraphs(editor, result.trim())
//       } catch (error) {
//         if (loadingInserted) {
//           const docSize = editor.state.doc.content.size
//           const loadingBlockSize = loadingText.length + 2

//           editor
//             .chain()
//             .focus()
//             .deleteRange({
//               from: Math.max(0, docSize - loadingBlockSize),
//               to: docSize,
//             })
//             .run()
//         }

//         const message =
//           error instanceof Error ? error.message : 'AI 생성 실패'

//         editor
//           .chain()
//           .focus()
//           .insertContent({
//             type: 'paragraph',
//             content: [{ type: 'text', text: `AI 생성 실패: ${message}` }],
//           })
//           .run()
//       } finally {
//         runningRef.current = false
//       }
//     }

//     const dom = editor.view.dom
//     dom.addEventListener('keydown', handleKeyDown)

//     return () => {
//       dom.removeEventListener('keydown', handleKeyDown)
//     }
//   }, [editor])
// }