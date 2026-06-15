'use client'

import type { AIDraftStreamState } from '@/features/ai/types'

type Props = {
  state: AIDraftStreamState
  error?: string | null
}

export function AIStreamStatus({ state, error }: Props) {
  if (state === 'idle') {
    return <span className="text-xs text-gray-500">AI 대기 중</span>
  }

  if (state === 'streaming') {
    return <span className="text-xs font-medium text-blue-600">AI 생성 중...</span>
  }

  if (state === 'done') {
    return <span className="text-xs font-medium text-green-600">생성 완료</span>
  }

  return (
    <span className="text-xs font-medium text-red-600">
      {error || 'AI 생성 실패'}
    </span>
  )
}