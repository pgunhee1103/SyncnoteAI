import { NextResponse } from 'next/server'
import { requireUser } from '@/server/guards/require-user'
import {
  createDocument,
  getMyDocuments,
} from '@/features/documents/server/documents.service'

export async function GET() {
  try {
    const user = await requireUser()
    const documents = await getMyDocuments(user.id)

    return NextResponse.json({ documents })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { message: '문서 목록을 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    const user = await requireUser()
    const document = await createDocument(user.id)

    return NextResponse.json(
      {
        message: '문서가 생성되었습니다.',
        document,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { message: '문서를 생성하지 못했습니다.' },
      { status: 500 },
    )
  }
}