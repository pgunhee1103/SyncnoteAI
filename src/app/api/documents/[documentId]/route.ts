import { NextResponse } from 'next/server'
import { requireUser } from '@/server/guards/require-user'
import {
  deleteDocumentForUser,
  getDocumentByIdForUser,
} from '@/features/documents/server/documents.service'

type Context = {
  params: Promise<{ documentId: string }>
}

export async function GET(_: Request, context: Context) {
  try {
    const user = await requireUser()
    const { documentId } = await context.params

    const document = await getDocumentByIdForUser(documentId, user.id)

    return NextResponse.json({ document })
  } catch (error) {
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
      { message: '문서를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const user = await requireUser()
    const { documentId } = await context.params

    const deleted = await deleteDocumentForUser(documentId, user.id)

    return NextResponse.json({
      message: '문서가 삭제되었습니다.',
      deleted,
    })
  } catch (error) {
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

      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: '문서를 삭제하지 못했습니다.' },
      { status: 500 },
    )
  }
}