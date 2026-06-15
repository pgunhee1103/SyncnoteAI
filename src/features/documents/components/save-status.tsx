'use client'

type Props = {
  status: 'idle' | 'saving' | 'saved' | 'error'
}

export function SaveStatus({ status }: Props) {
  const textMap = {
    idle: '대기 중',
    saving: '저장 중...',
    saved: '저장 완료',
    error: '저장 실패',
  }

  const colorMap = {
    idle: 'text-gray-500',
    saving: 'text-blue-600',
    saved: 'text-green-600',
    error: 'text-red-600',
  }

  return (
    <span className={`text-xs font-medium ${colorMap[status]}`}>
      {textMap[status]}
    </span>
  )
}