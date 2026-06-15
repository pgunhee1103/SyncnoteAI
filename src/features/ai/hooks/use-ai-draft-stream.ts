'use client'

import { useRef, useState } from 'react'
import type { AIDraftMode, AIDraftStreamState } from '@/features/ai/types'

type StartParams = {
  mode: AIDraftMode
  prompt: string
  title?: string
  content?: string
  onDone?: (finalText: string) => void
}

export function useAIDraftStream() {
  const [state, setState] = useState<AIDraftStreamState>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const textRef = useRef('')

  async function startStream(params: StartParams) {
    controllerRef.current?.abort()

    const controller = new AbortController()
    controllerRef.current = controller

    setState('streaming')
    setText('')
    setError(null)
    textRef.current = ''

    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: params.mode,
          prompt: params.prompt,
          title: params.title,
          content: params.content,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? 'AI 요청에 실패했습니다.')
      }

      if (!res.body) {
        throw new Error('스트림 응답이 없습니다.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        textRef.current += chunk
        setText(textRef.current)
      }

      setState('done')
      params.onDone?.(textRef.current)
    } catch (error) {
      if (controller.signal.aborted) {
        setState('idle')
        return
      }

      setState('error')
      setError(error instanceof Error ? error.message : 'AI 요청 실패')
    }
  }

  function stopStream() {
    controllerRef.current?.abort()
    controllerRef.current = null
    setState('idle')
  }

  function reset() {
    setState('idle')
    setText('')
    setError(null)
    textRef.current = ''
  }

  return {
    state,
    text,
    error,
    startStream,
    stopStream,
    reset,
    isStreaming: state === 'streaming',
    isDone: state === 'done',
  }
}