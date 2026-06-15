export type AIDraftMode = 'draft' | 'improve' | 'summary' | 'title'

export type AIDraftRequest = {
  mode: AIDraftMode
  prompt: string
  title?: string
  content?: string
}

export type AIDraftStreamState = 'idle' | 'streaming' | 'done' | 'error'