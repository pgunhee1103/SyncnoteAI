'use client'

import { useMemo, useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { useAIDraftStream } from '@/features/ai/hooks/use-ai-draft-stream'
import { AIStreamStatus } from '@/features/ai/components/ai-stream-status'
import { AIGenerateButton } from '@/features/ai/components/ai-generate-button'
import type { AIDraftMode } from '@/features/ai/types'
import { parseTitleCandidates } from '@/features/ai/lib/ai-parser'
import { useAIPanelStore } from '@/features/ai/store/ai-panel-store'

type Props = {
  editor: Editor | null
  documentTitle: string
}

function insertTextAsParagraphs(editor: Editor, text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: part }],
    }))

  if (blocks.length === 0) return

  editor.chain().focus().insertContent(blocks).run()
}

export function AIDraftPanel({ editor, documentTitle }: Props) {
  const { open, closePanel, initialPrompt, clearPrompt } = useAIPanelStore()

  const [mode, setMode] = useState<AIDraftMode>('draft')
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    if (open && initialPrompt) {
      setPrompt(initialPrompt)
      clearPrompt()
    }
  }, [open, initialPrompt, clearPrompt])

  const [autoInsert, setAutoInsert] = useState(false)

  const {
    state,
    text,
    error,
    startStream,
    stopStream,
    reset,
    isStreaming,
    isDone,
  } = useAIDraftStream()

  const currentEditorText = useMemo(() => {
    return editor?.getText() ?? ''
  }, [editor])

  const titleCandidates = useMemo(() => {
    return mode === 'title' ? parseTitleCandidates(text) : []
  }, [mode, text])

  async function handleGenerate() {
    if (!prompt.trim()) {
      alert('프롬프트를 입력해주세요.')
      return
    }

    await startStream({
      mode,
      prompt,
      title: documentTitle,
      content: currentEditorText,
      onDone: (finalText) => {
        if (!editor || !autoInsert) return
        if (mode === 'title') return
        insertTextAsParagraphs(editor, finalText)
      },
    })
  }

  function handleInsert() {
    if (!editor || !text.trim()) return
    if (mode === 'title') return
    insertTextAsParagraphs(editor, text)
  }

  function handleInsertTitle(title: string) {
    if (!editor) return
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: title }],
        },
      ],
    })
  }

  if (!open) {
    return (
      <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">AI Draft</h2>
          </div>
          
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('syncnote:open-ai-panel'))
            }}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            패널 열기
          </button>
        </div>
        <div className="mt-5">
          <p className="text-sm text-gray-500">
            <code>/ai</code>를 입력하거나 버튼으로 열 수 있습니다.
          </p>
        </div>
      </aside>
    )
  }
  //<aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
//      <div className="flex items-start justify-between gap-3">
  return (
    <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">AI Draft</h2>
        </div>

        <button
          type="button"
          onClick={closePanel}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-600 transition hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
      <div className="mt-5">
        <p className="text-sm text-gray-500">
          <AIStreamStatus state={state} error={error} />
        </p>
      </div>

      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as AIDraftMode)}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
      >
        <option value="draft">초안 작성</option>
        <option value="improve">문장 개선</option>
        <option value="summary">요약</option>
        <option value="title">제목 제안</option>
      </select>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="예: 회의 내용을 바탕으로 주간 보고서 초안을 작성해줘"
        className="min-h-[120px] w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-gray-900"
      />

      {mode !== 'title' ? (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={autoInsert}
            onChange={(e) => setAutoInsert(e.target.checked)}
          />
          완료 시 자동으로 문서에 삽입
        </label>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <AIGenerateButton
          loading={isStreaming}
          onGenerate={handleGenerate}
          onStop={stopStream}
        />

        <button
          type="button"
          onClick={handleInsert}
          disabled={!isDone || !text.trim() || !editor || mode === 'title'}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          문서에 삽입
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={isStreaming}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          초기화
        </button>
      </div>

      {mode === 'title' && titleCandidates.length > 0 ? (
        <div className="space-y-2 rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500">제목 후보</p>
          <div className="flex flex-col gap-2">
            {titleCandidates.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => handleInsertTitle(title)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="mb-2 text-xs font-medium text-gray-500">실시간 미리보기</p>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {text || '아직 생성된 내용이 없습니다.'}
          </pre>
        </div>
      )}
    </aside>
  )
}