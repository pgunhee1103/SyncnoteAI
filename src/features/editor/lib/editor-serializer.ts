type JsonContent = Record<string, unknown>

const DEFAULT_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export function parseEditorContent(content: string): JsonContent {
  if (!content || !content.trim()) {
    return DEFAULT_DOC
  }

  try {
    const parsed = JSON.parse(content) // 문자열을 객체로 반환 -> tiptap이 쓸 수 있는 형태로 변환

    if (parsed && typeof parsed === 'object') {
      return parsed
    }

    return DEFAULT_DOC // JSON 파싱은 됐는데 객체가 아니면 문서구조로 사용 불가 -> 기본문서 반환
  } catch { // ex) 일반 텍스트가 들어있을 경우 JSON이 아니니까 JSON.parse 실패 -> 에러대신 Tiptap 문서 구조로 감싸서 보여주기
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: content }],
        },
      ],
    }
  }
}

// Tiptap 객체 → 문자열(DB 저장할 때 보통 string으로 넣으니까 이 함수가 필요)
export function stringifyEditorContent(content: JsonContent): string {
  return JSON.stringify(content)
}