import * as Y from 'yjs'
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness'
import type { Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/server/socket/socket-events'

type SharedAccess = {
  shareId: string
  guestId: string
  guestName: string
}

type CollaborationUser = {
  id: string
  name: string
  color: string
}

type Options = {
  socket: Socket
  room: string
  documentId: string
  doc: Y.Doc
  sharedAccess?: SharedAccess

  /*
   * 기존 호출부 호환용이다.
   * 최종 이름과 색상은 서버 입장 응답을 사용한다.
   */
  user?: {
    name: string
    color?: string
  }

  onSynced?: () => void
  onError?: (message: string) => void
}

type YjsJoinSuccess = {
  ok: true
  update: number[]
  awarenessUpdate: number[]
  user: CollaborationUser
}

type YjsJoinFailure = {
  ok: false
  message: string
}

type YjsJoinResponse =
  | YjsJoinSuccess
  | YjsJoinFailure

type YjsUpdatePayload = {
  room: string
  update: number[]
}

type AwarenessPayload = {
  room: string
  update: number[]
  clientIds: number[]
}

export class SocketIOYjsProvider {
  readonly socket: Socket
  readonly room: string
  readonly documentId: string
  readonly doc: Y.Doc
  readonly awareness: Awareness

  synced = false

  private readonly sharedAccess?: SharedAccess
  private readonly onSynced?: () => void
  private readonly onError?: (
    message: string,
  ) => void

  private joined = false
  private joining = false
  private destroyed = false

  constructor(options: Options) {
    this.socket = options.socket
    this.room = options.room
    this.documentId = options.documentId
    this.doc = options.doc
    this.sharedAccess =
      options.sharedAccess
    this.onSynced = options.onSynced
    this.onError = options.onError

    this.awareness = new Awareness(
      this.doc,
    )

    /*
     * 서버 입장 응답에서 사용자 색상을 받기 전에는
     * 빈 사용자가 표시되지 않도록 offline 상태로 둔다.
     */
    this.awareness.setLocalState(null)

    this.join = this.join.bind(this)

    this.handleDisconnect =
      this.handleDisconnect.bind(this)

    this.handleRemoteUpdate =
      this.handleRemoteUpdate.bind(this)

    this.handleLocalUpdate =
      this.handleLocalUpdate.bind(this)

    this.handleRemoteAwareness =
      this.handleRemoteAwareness.bind(this)

    this.handleLocalAwareness =
      this.handleLocalAwareness.bind(this)

    this.socket.on(
      'connect',
      this.join,
    )

    this.socket.on(
      'disconnect',
      this.handleDisconnect,
    )

    this.socket.on(
      SOCKET_EVENTS.YJS_SYNC_UPDATE,
      this.handleRemoteUpdate,
    )

    this.socket.on(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      this.handleRemoteAwareness,
    )

    this.doc.on(
      'update',
      this.handleLocalUpdate,
    )

    this.awareness.on(
      'update',
      this.handleLocalAwareness,
    )

    if (this.socket.connected) {
      this.join()
    } else {
      this.socket.connect()
    }
  }

  private join() {
    if (
      this.destroyed ||
      this.joined ||
      this.joining
    ) {
      return
    }

    this.joining = true

    this.socket
      .timeout(10_000)
      .emit(
        SOCKET_EVENTS.YJS_JOIN,
        {
          room: this.room,
          documentId: this.documentId,
          shareId:
            this.sharedAccess?.shareId,
          guestId:
            this.sharedAccess?.guestId,
          guestName:
            this.sharedAccess?.guestName,
        },
        (
          error: Error | null,
          response?: YjsJoinResponse,
        ) => {
          this.joining = false

          if (this.destroyed) {
            return
          }

          if (error) {
            this.onError?.(
              '협업 서버 응답 시간이 초과되었습니다.',
            )
            return
          }

          if (
            !response ||
            !response.ok
          ) {
            this.onError?.(
              response && !response.ok
                ? response.message
                : '협업 room 입장에 실패했습니다.',
            )
            return
          }

          /*
           * 먼저 기존 문서와 기존 참여자 상태를 반영한다.
           */
          Y.applyUpdate(
            this.doc,
            Uint8Array.from(
              response.update,
            ),
            this,
          )

          if (
            response.awarenessUpdate.length >
            0
          ) {
            applyAwarenessUpdate(
              this.awareness,
              Uint8Array.from(
                response.awarenessUpdate,
              ),
              this,
            )
          }

          /*
           * 재연결 시 서버가 기억하는 null 상태보다
           * Awareness clock이 반드시 커지도록 한 번 비운 뒤
           * 서버에서 배정한 사용자 상태를 적용한다.
           */
          this.awareness.setLocalState(
            null,
          )

          this.joined = true
          this.synced = true

          /*
           * 이 시점의 setLocalState가 update 이벤트를 발생시키므로
           * 클릭하지 않아도 즉시 다른 참가자에게 입장이 전달된다.
           */
          this.awareness.setLocalState({
            user: response.user,
            activeField: null,
            cursor: null,
          })

          this.onSynced?.()
        },
      )
  }

  private handleDisconnect() {
    this.joined = false
    this.joining = false
    this.synced = false

    /*
     * 연결이 끊긴 화면에서 이미 나간 사용자가 계속
     * 보이지 않도록 원격 Awareness를 로컬에서 제거한다.
     */
    const remoteClientIds = Array.from(
      this.awareness
        .getStates()
        .keys(),
    ).filter(
      (clientId) =>
        clientId !== this.doc.clientID,
    )

    if (remoteClientIds.length > 0) {
      removeAwarenessStates(
        this.awareness,
        remoteClientIds,
        this,
      )
    }
  }

  private handleRemoteUpdate(
    payload: YjsUpdatePayload,
  ) {
    if (
      payload.room !== this.room
    ) {
      return
    }

    Y.applyUpdate(
      this.doc,
      Uint8Array.from(payload.update),
      this,
    )
  }

  private handleLocalUpdate(
    update: Uint8Array,
    origin: unknown,
  ) {
    if (
      this.destroyed ||
      !this.joined ||
      origin === this
    ) {
      return
    }

    this.socket.emit(
      SOCKET_EVENTS.YJS_SYNC_UPDATE,
      {
        room: this.room,
        update: Array.from(update),
      },
    )
  }

  private handleRemoteAwareness(
    payload: AwarenessPayload,
  ) {
    if (
      payload.room !== this.room
    ) {
      return
    }

    applyAwarenessUpdate(
      this.awareness,
      Uint8Array.from(payload.update),
      this,
    )
  }

  private handleLocalAwareness(
    changes: {
      added: number[]
      updated: number[]
      removed: number[]
    },
    origin: unknown,
  ) {
    if (
      this.destroyed ||
      !this.joined ||
      origin === this
    ) {
      return
    }

    const clientIds = [
      ...changes.added,
      ...changes.updated,
      ...changes.removed,
    ]

    if (clientIds.length === 0) {
      return
    }

    const update =
      encodeAwarenessUpdate(
        this.awareness,
        clientIds,
      )

    this.socket.emit(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      {
        room: this.room,
        update: Array.from(update),
        clientIds,
      },
    )
  }

  destroy() {
    if (this.destroyed) {
      return
    }

    /*
     * joined가 true인 동안 null 상태를 설정해야
     * 제거 Awareness update가 서버로 전달된다.
     */
    if (this.joined) {
      this.awareness.setLocalState(
        null,
      )
    }

    this.socket.emit(
      SOCKET_EVENTS.YJS_LEAVE,
      {
        room: this.room,
      },
    )

    this.destroyed = true
    this.joined = false
    this.joining = false
    this.synced = false

    this.socket.off(
      'connect',
      this.join,
    )

    this.socket.off(
      'disconnect',
      this.handleDisconnect,
    )

    this.socket.off(
      SOCKET_EVENTS.YJS_SYNC_UPDATE,
      this.handleRemoteUpdate,
    )

    this.socket.off(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      this.handleRemoteAwareness,
    )

    this.doc.off(
      'update',
      this.handleLocalUpdate,
    )

    this.awareness.off(
      'update',
      this.handleLocalAwareness,
    )

    this.awareness.destroy()
  }
}