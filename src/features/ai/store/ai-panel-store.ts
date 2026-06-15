'use client'

import { useSyncExternalStore } from 'react'

type State = {
  open: boolean
  initialPrompt: string
}

let state: State = {
  open: false,
  initialPrompt: '',
}

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export function openAIPanel(initialPrompt = '') {
  state = {
    open: true,
    initialPrompt,
  }
  emit()
}

export function closeAIPanel() {
  state = {
    ...state,
    open: false,
  }
  emit()
}

export function clearAIPanelPrompt() {
  state = {
    ...state,
    initialPrompt: '',
  }
  emit()
}

export function toggleAIPanel() {
  state = {
    ...state,
    open: !state.open,
  }
  emit()
}

export function useAIPanelStore() {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
    () => state,
  )

  return {
    open: snapshot.open,
    initialPrompt: snapshot.initialPrompt,
    openPanel: openAIPanel,
    closePanel: closeAIPanel,
    clearPrompt: clearAIPanelPrompt,
    togglePanel: toggleAIPanel,
  }
}