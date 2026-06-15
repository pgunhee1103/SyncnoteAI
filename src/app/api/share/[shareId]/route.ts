import { NextResponse } from 'next/server'
import { getSharedDocumentByShareId } from '@/features/documents/server/documents.service'

type Context = {
  params: Promise<{ shareId: string }>
}

export async function GET(_: Request, context: Context) {
  try {
    const { shareId } = await context.params
    const document = await getSharedDocumentByShareId(shareId)

    return NextResponse.json({ document })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { message: '공유 문서를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { message: '공유 문서를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}