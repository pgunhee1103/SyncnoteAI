import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

type AICommandRange = {
  from: number
  to: number
}

function getAICommandRange(state: EditorState): AICommandRange | null {
  const { $from } = state.selection
  const parent = $from.parent
  const parentStart = $from.start()

  const textBeforeCursor = parent.textBetween(0, $from.parentOffset, '\n', '\n')
  const match = textBeforeCursor.match(/(?:^|\s)(\/ai(?:\s+.*)?)$/)

  if (!match) {
    return null
  }

  const fullCommand = match[1]
  const from = parentStart + textBeforeCursor.lastIndexOf(fullCommand)
  const to = parentStart + $from.parentOffset

  return { from, to }
}

function createBadge() {
  const badge = document.createElement('span')
  badge.className = 'ai-command-badge'
  badge.textContent = 'AI'
  return badge
}

function createHint() {
  const hint = document.createElement('span')
  hint.className = 'ai-command-hint'
  hint.textContent = 'Enter로 실행'
  return hint
}

export const AICommandHighlight = Extension.create({
  name: 'aiCommandHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('aiCommandHighlight'),

        props: {
          decorations(state) {
            const range = getAICommandRange(state)

            if (!range) {
              return DecorationSet.empty
            }

            return DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, {
                class: 'ai-command-inline',
              }),
              Decoration.widget(range.from, createBadge, {
                side: -1,
              }),
              Decoration.widget(range.to, createHint, {
                side: 1,
              }),
            ])
          },
        },
      }),
    ]
  },
})