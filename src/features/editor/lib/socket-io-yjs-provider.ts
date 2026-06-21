import * as Y from 'yjs'
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness'
import type { Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/server/socket/socket-events'

type SharedAccess = {
  shareId: string
  guestId: string
  guestName: string
}

type Options = {
  socket: Socket
  room: string
  documentId: string
  doc: Y.Doc
  sharedAccess?: SharedAccess
  user: {
    name: string
    color: string
  }
  onSynced?: () => void
  onError?: (message: string) => void
}

type YjsUpdatePayload = {
  room: string
  update: number[]
}

type AwarenessPayload = {
  room: string
  update: number[]
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
  private readonly onError?: (message: string) => void

  private destroyed = false
  private syncTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: Options) {
    this.socket = options.socket
    this.room = options.room
    this.documentId = options.documentId
    this.doc = options.doc
    this.sharedAccess = options.sharedAccess
    this.onSynced = options.onSynced
    this.onError = options.onError

    this.awareness = new Awareness(this.doc)

    this.join = this.join.bind(this)
    this.handleDisconnect = this.handleDisconnect.bind(this)
    this.handleRemoteUpdate = this.handleRemoteUpdate.bind(this)
    this.handleLocalUpdate = this.handleLocalUpdate.bind(this)
    this.handleRemoteAwareness =
      this.handleRemoteAwareness.bind(this)
    this.handleLocalAwareness =
      this.handleLocalAwareness.bind(this)

    this.socket.on('connect', this.join)
    this.socket.on('disconnect', this.handleDisconnect)

    this.socket.on(
      SOCKET_EVENTS.YJS_SYNC_UPDATE,
      this.handleRemoteUpdate,
    )

    this.socket.on(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      this.handleRemoteAwareness,
    )

    this.doc.on('update', this.handleLocalUpdate)

    this.awareness.on(
      'update',
      this.handleLocalAwareness,
    )

    this.awareness.setLocalState({
      user: options.user,
      activeField: null,
      cursor: null,
    })

    if (this.socket.connected) {
      this.join()
    }
  }

  private join() {
    if (this.destroyed) {
      return
    }

    this.synced = false

    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }

    this.syncTimer = setTimeout(() => {
      if (this.synced || this.destroyed) {
        return
      }

      this.onError?.(
        '협업 서버의 동기화 응답을 받지 못했습니다.',
      )
    }, 10_000)

    this.socket.emit(SOCKET_EVENTS.YJS_JOIN, {
      room: this.room,
      documentId: this.documentId,
      shareId: this.sharedAccess?.shareId,
      guestId: this.sharedAccess?.guestId,
      guestName: this.sharedAccess?.guestName,
    })
  }

  private handleDisconnect() {
    this.synced = false
  }

  private handleRemoteUpdate(payload: YjsUpdatePayload) {
    if (payload.room !== this.room) {
      return
    }

    Y.applyUpdate(
      this.doc,
      Uint8Array.from(payload.update),
      this,
    )

    if (!this.synced) {
      this.synced = true

      if (this.syncTimer) {
        clearTimeout(this.syncTimer)
        this.syncTimer = null
      }

      this.broadcastLocalAwareness()
      this.onSynced?.()
    }
  }

  private handleLocalUpdate(
    update: Uint8Array,
    origin: unknown,
  ) {
    if (
      this.destroyed ||
      !this.synced ||
      origin === this
    ) {
      return
    }

    this.socket.emit(SOCKET_EVENTS.YJS_SYNC_UPDATE, {
      room: this.room,
      update: Array.from(update),
    })
  }

  private handleRemoteAwareness(
    payload: AwarenessPayload,
  ) {
    if (payload.room !== this.room) {
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
      !this.synced ||
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

    const update = encodeAwarenessUpdate(
      this.awareness,
      clientIds,
    )

    this.socket.emit(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      {
        room: this.room,
        update: Array.from(update),
      },
    )
  }

  private broadcastLocalAwareness() {
    const update = encodeAwarenessUpdate(
      this.awareness,
      [this.doc.clientID],
    )

    this.socket.emit(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      {
        room: this.room,
        update: Array.from(update),
      },
    )
  }

  destroy() {
    if (this.destroyed) {
      return
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }

    if (this.synced) {
      this.awareness.setLocalState(null)
    }

    this.socket.emit(SOCKET_EVENTS.YJS_LEAVE, {
      room: this.room,
    })

    this.destroyed = true
    this.synced = false

    this.socket.off('connect', this.join)
    this.socket.off('disconnect', this.handleDisconnect)

    this.socket.off(
      SOCKET_EVENTS.YJS_SYNC_UPDATE,
      this.handleRemoteUpdate,
    )

    this.socket.off(
      SOCKET_EVENTS.YJS_AWARENESS_UPDATE,
      this.handleRemoteAwareness,
    )

    this.doc.off('update', this.handleLocalUpdate)

    this.awareness.off(
      'update',
      this.handleLocalAwareness,
    )

    this.awareness.destroy()
  }
}