'use client'

type Props = {
  loading: boolean
  onGenerate: () => void
  onStop: () => void
}

export function AIGenerateButton({ loading, onGenerate, onStop }: Props) {
  if (loading) {
    return (
      <button
        type="button"
        onClick={onStop}
        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
      >
        생성 중지
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onGenerate}
      className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-black"
    >
      AI 초안 생성
    </button>
  )
}