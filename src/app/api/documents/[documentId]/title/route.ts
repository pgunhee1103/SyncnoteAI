import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/server/auth/current-user'
import { updateDocumentTitleForUser } from '@/features/documents/server/documents.service'

const schema = z.object({
  title: z.string(),
})

type Context = {
  params: Promise<{ documentId: string }>
}

export async function PATCH(req: Request, context: Context) {
  try {
    const user = await getCurrentUser()
    const shareId = req.headers.get('x-share-id') ?? undefined
    const { documentId } = await context.params
    const body = await req.json()
    const parsed = schema.parse(body)

    const document = await updateDocumentTitleForUser(
      documentId,
      user?.id ?? null,
      shareId,
      parsed.title,
    )

    return NextResponse.json({
      message: '제목이 수정되었습니다.',
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
      { message: '제목 수정에 실패했습니다.' },
      { status: 500 },
    )
  }
}