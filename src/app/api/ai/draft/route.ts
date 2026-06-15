import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db/prisma'
import { getCurrentUser } from '@/server/auth/current-user'

const schema = z.object({
  documentId: z.string(),
  prompt: z.string().min(1),
  content: z.string().optional(),
  shareId: z.string().optional(),
})

async function canUseAI(documentId: string, shareId?: string) {
  const user = await getCurrentUser()

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ownerId: true,
      shareId: true,
      shareCanEdit: true,
    },
  })

  if (!document) {
    throw new Error('NOT_FOUND')
  }

  if (user && document.ownerId === user.id) {
    return true
  }

  if (shareId && document.shareId === shareId && document.shareCanEdit) {
    return true
  }

  throw new Error('UNAUTHORIZED')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.parse(body)

    await canUseAI(parsed.documentId, parsed.shareId)

    const apiKey = process.env.AI_API_KEY
    const baseUrl = process.env.AI_API_URL ?? 'https://openrouter.ai/api/v1'
    const model = process.env.AI_MODEL ?? 'openai/gpt-4o-mini'

    if (!apiKey) {
      return NextResponse.json(
        { message: 'AI_API_KEY가 설정되어 있지 않습니다.' },
        { status: 500 },
      )
    }

    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SyncNoteAI',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              'You are a writing assistant. Return only the final result. Do not include explanations, markdown fences, or unnecessary commentary.',
          },
          {
            role: 'user',
            content: [
              `사용자 요청: ${parsed.prompt}`,
              '',
              '현재 문서 내용:',
              parsed.content ?? '',
            ].join('\n'),
          },
        ],
      }),
    })

    if (!aiRes.ok || !aiRes.body) {
      const data = await aiRes.json().catch(() => null)

      return NextResponse.json(
        { message: data?.error?.message ?? 'AI 요청 실패' },
        { status: aiRes.status || 500 },
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue

              const data = trimmed.replace(/^data:\s*/, '')

              if (data === '[DONE]') {
                controller.close()
                return
              }

              try {
                const json = JSON.parse(data)
                const text = json.choices?.[0]?.delta?.content

                if (typeof text === 'string') {
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // SSE 조각 파싱 실패는 무시
              }
            }
          }

          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: '입력값이 올바르지 않습니다.', errors: error.issues },
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

      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { message: '인증이 필요합니다.' },
          { status: 401 },
        )
      }
    }

    return NextResponse.json(
      { message: 'AI 생성에 실패했습니다.' },
      { status: 500 },
    )
  }
}