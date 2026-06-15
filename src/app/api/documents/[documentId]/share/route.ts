import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/guards/require-user'
import { createShareLinkForUser } from '@/features/documents/server/documents.service'

const schema = z.object({
  shareCanEdit: z.boolean(),
})

type Context = {
  params: Promise<{ documentId: string }>
}

export async function POST(req: Request, context: Context) {
  try {
    const user = await requireUser()
    const { documentId } = await context.params
    const body = await req.json()
    const parsed = schema.parse(body)

    const document = await createShareLinkForUser(
      documentId,
      user.id,
      parsed.shareCanEdit,
    )

    const origin = new URL(req.url).origin
    const shareUrl = `${origin}/share/${document.shareId}`

    return NextResponse.json({
      message: '공유 링크가 생성되었습니다.',
      document,
      shareUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: '입력값이 올바르지 않습니다.', errors: error.issues },
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
      { message: '공유 링크를 생성하지 못했습니다.' },
      { status: 500 },
    )
  }
}