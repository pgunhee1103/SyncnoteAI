import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/guards/require-user'
import { requestAIDraftStream } from '@/features/ai/server/ai.service'

const schema = z.object({
  prompt: z.string().trim().min(1, '프롬프트를 입력해주세요.'),
  content: z.string().optional(),
})

function extractDeltaText(json: any): string {
  return json?.choices?.[0]?.delta?.content ?? ''
}

export async function POST(req: Request) {
  try {
    await requireUser()

    const body = await req.json()
    const parsed = schema.parse(body)

    const upstream = await requestAIDraftStream(
      parsed.prompt,
      parsed.content,
      req.signal,
    )

    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    const reader = upstream.body!.getReader()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              break
            }

            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()

              if (!trimmed.startsWith('data:')) {
                continue
              }

              const data = trimmed.replace(/^data:\s*/, '')

              if (data === '[DONE]') {
                controller.close()
                return
              }

              try {
                const json = JSON.parse(data)
                const text = extractDeltaText(json)

                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // 파싱 불가 chunk 무시
              }
            }
          }

          controller.close()
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      },
      cancel() {
        reader.cancel().catch(() => null)
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
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

      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: 'AI 초안 생성에 실패했습니다.' },
      { status: 500 },
    )
  }
}