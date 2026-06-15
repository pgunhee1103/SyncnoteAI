const MAX_CONTEXT_CHARS = 4000

function getSystemPrompt() {
  return `불필요한 설명 없이 결과만 출력해라.
          마크다운 코드블록을 사용하지 마라.
          설명하지 말고 결과만 출력해라.
          한국어로 출력해라.`
}

function limitContent(content?: string) {
  if (!content) return ''
  if (content.length <= MAX_CONTEXT_CHARS) return content
  return content.slice(-MAX_CONTEXT_CHARS)
}

export async function requestAIDraftStream(
  prompt: string,
  content?: string,
  signal?: AbortSignal,
) {
  const apiUrl = process.env.AI_API_URL
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL

  if (!apiUrl || !apiKey || !model) {
    throw new Error('AI 환경변수가 설정되지 않았습니다.')
  }

  const limitedContent = limitContent(content)

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(),
        },
        {
          role: 'user',
          content: `요청:
${prompt}

현재 문서:
${limitedContent}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || 'AI 요청에 실패했습니다.')
  }

  if (!response.body) {
    throw new Error('AI 스트림 응답이 비어 있습니다.')
  }

  return response
}