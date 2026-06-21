'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as Y from 'yjs'
import { getSocket } from '@/lib/socket/socket-client'
import { SocketIOYjsProvider } from '@/features/editor/lib/socket-io-yjs-provider'

export type SharedAccess = {
  shareId: string
  guestId: string
  guestName: string
}

type CollaborationUser = {
  id: string
  name: string
}

type Props = {
  documentId: string
  user: CollaborationUser
  sharedAccess?: SharedAccess
  children: ReactNode
}

type CollaborationContextValue = {
  documentId: string
  ydoc: Y.Doc
  provider: SocketIOYjsProvider
}

type ConnectionState =
  | {
      status: 'connecting'
      message: null
      ydoc: null
      provider: null
    }
  | {
      status: 'ready'
      message: null
      ydoc: Y.Doc
      provider: SocketIOYjsProvider
    }
  | {
      status: 'error'
      message: string
      ydoc: null
      provider: null
    }

const DocumentCollaborationContext =
  createContext<CollaborationContextValue | null>(null)

function createUserColor(userId: string): string {
  let hash = 0

  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0
  }

  const hue = hash % 360

  return `hsl(${hue} 72% 46%)`
}

export function DocumentCollaborationProvider({
  documentId,
  user,
  sharedAccess,
  children,
}: Props) {
  const [retryCount, setRetryCount] = useState(0)

  const [connection, setConnection] = useState<ConnectionState>({
    status: 'connecting',
    message: null,
    ydoc: null,
    provider: null,
  })

  const accessKey = [
    sharedAccess?.shareId ?? 'owner',
    sharedAccess?.guestId ?? '',
    sharedAccess?.guestName ?? '',
  ].join(':')

  useEffect(() => {
    let cancelled = false

    const ydoc = new Y.Doc()
    const socket = getSocket()

    setConnection({
      status: 'connecting',
      message: null,
      ydoc: null,
      provider: null,
    })

    /*
     * 로그인 전 만들어진 Socket.IO 연결이 남아 있을 수 있으므로
     * 문서 협업을 시작할 때 현재 쿠키로 handshake를 다시 수행한다.
     */
    if (socket.connected) {
      socket.disconnect()
    }

    const provider = new SocketIOYjsProvider({
      socket,
      room: `document:${documentId}`,
      documentId,
      doc: ydoc,
      sharedAccess,
      user: {
        name: user.name,
        color: createUserColor(user.id),
      },
      onSynced: () => {
        if (cancelled) {
          return
        }

        setConnection({
          status: 'ready',
          message: null,
          ydoc,
          provider,
        })
      },
      onError: (message) => {
        if (cancelled) {
          return
        }

        setConnection({
          status: 'error',
          message,
          ydoc: null,
          provider: null,
        })
      },
    })

    /*
     * provider는 connect 이벤트를 구독한 상태이므로
     * 여기서 연결하면 최신 로그인 쿠키로 YJS_JOIN을 보낸다.
     */
    socket.connect()

    return () => {
      cancelled = true
      provider.destroy()
      ydoc.destroy()
    }
  }, [
    documentId,
    user.id,
    user.name,
    accessKey,
    retryCount,
  ])

  const contextValue = useMemo<CollaborationContextValue | null>(() => {
    if (connection.status !== 'ready') {
      return null
    }

    return {
      documentId,
      ydoc: connection.ydoc,
      provider: connection.provider,
    }
  }, [connection, documentId])

  /*
   * 핵심:
   * provider sync가 끝나기 전에는 제목/본문 에디터를 아예
   * 마운트하지 않는다.
   */
  if (connection.status === 'connecting') {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            협업 문서를 연결하는 중...
          </p>
        </div>
      </main>
    )
  }

  if (connection.status === 'error' || !contextValue) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="font-semibold text-red-700">
            협업 문서를 열지 못했습니다.
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {connection.message}
          </p>

          <button
            type="button"
            onClick={() => {
              setRetryCount((value) => value + 1)
            }}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700"
          >
            다시 연결
          </button>
        </div>
      </main>
    )
  }

  return (
    <DocumentCollaborationContext.Provider value={contextValue}>
      {children}
    </DocumentCollaborationContext.Provider>
  )
}

export function useDocumentCollaboration(): CollaborationContextValue {
  const context = useContext(DocumentCollaborationContext)

  if (!context) {
    throw new Error(
      'useDocumentCollaboration은 DocumentCollaborationProvider 내부에서 사용해야 합니다.',
    )
  }

  return context
}