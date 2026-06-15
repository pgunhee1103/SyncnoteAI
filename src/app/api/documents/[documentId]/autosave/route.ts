// import { NextResponse } from 'next/server'
// import { z } from 'zod'
// import { getCurrentUser } from '@/server/auth/current-user'
// import {
//   autosaveDocumentForSharedLink,
//   autosaveDocumentForUser,
// } from '@/features/documents/server/documents.service'

// const schema = z.object({
//   content: z.string(),
//   shareId: z.string().optional(),
// })

// type Context = {
//   params: Promise<{ documentId: string }>
// }

// export async function PATCH(req: Request, context: Context) {
//   try {
//     const user = await getCurrentUser()
//     const { documentId } = await context.params
//     const body = await req.json()
//     const parsed = schema.parse(body)

//     let document

//     // 공유 편집 링크가 있으면 그 권한을 우선 사용
//     if (parsed.shareId) {
//       document = await autosaveDocumentForSharedLink(
//         documentId,
//         parsed.shareId,
//         parsed.content,
//       )
//     } else if (user) {
//       document = await autosaveDocumentForUser(
//         documentId,
//         user.id,
//         parsed.content,
//       )
//     } else {
//       throw new Error('UNAUTHORIZED')
//     }

//     return NextResponse.json({
//       message: '저장되었습니다.',
//       document,
//     })
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         {
//           message: '입력값이 올바르지 않습니다.',
//           errors: error.issues,
//         },
//         { status: 400 },
//       )
//     }

//     if (error instanceof Error) {
//       if (error.message === 'UNAUTHORIZED') {
//         return NextResponse.json(
//           { message: '인증이 필요합니다.' },
//           { status: 401 },
//         )
//       }

//       if (error.message === 'NOT_FOUND') {
//         return NextResponse.json(
//           { message: '문서를 찾을 수 없습니다.' },
//           { status: 404 },
//         )
//       }

//       if (error.message === 'FORBIDDEN') {
//         return NextResponse.json(
//           { message: '접근 권한이 없습니다.' },
//           { status: 403 },
//         )
//       }

//       return NextResponse.json(
//         { message: error.message },
//         { status: 500 },
//       )
//     }

//     return NextResponse.json(
//       { message: '자동 저장에 실패했습니다.' },
//       { status: 500 },
//     )
//   }
// }

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/server/auth/current-user'
import {
  autosaveDocumentForSharedLink,
  autosaveDocumentForUser,
} from '@/features/documents/server/documents.service'

const schema = z.object({
  content: z.string(),
  shareId: z.string().optional(),
})

type Context = {
  params: Promise<{ documentId: string }>
}

export async function PATCH(req: Request, context: Context) {
  try {
    const user = await getCurrentUser()
    const { documentId } = await context.params
    const body = await req.json()
    const parsed = schema.parse(body)

    const document = parsed.shareId
      ? await autosaveDocumentForSharedLink(
          documentId,
          parsed.shareId,
          parsed.content,
        )
      : user
        ? await autosaveDocumentForUser(documentId, user.id, parsed.content)
        : (() => {
            throw new Error('UNAUTHORIZED')
          })()

    return NextResponse.json({
      message: '저장되었습니다.',
      document,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: '입력값이 올바르지 않습니다.',
          errors: error.issues,
        },
        { status: 400 },
      )
    }

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { message: '인증이 필요합니다.' },
          { status: 401 },
        )
      }

      if (error.message === 'NOT_FOUND') {
        return NextResponse.json(
          { message: '문서를 찾을 수 없습니다.' },
          { status: 404 },
        )
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { message: '접근 권한이 없습니다.' },
          { status: 403 },
        )
      }
    }

    return NextResponse.json(
      { message: '자동 저장에 실패했습니다.' },
      { status: 500 },
    )
  }
}