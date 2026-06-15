import * as Y from 'yjs'
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
  onSynced?: () => void
}

type YjsUpdatePayload = {
  room: string
  update: number[]
}

export class SocketIOYjsProvider {
  socket: Socket
  room: string
  documentId: string
  doc: Y.Doc
  synced = false

  private sharedAccess?: SharedAccess
  private onSynced?: () => void

  constructor(options: Options) {
    this.socket = options.socket
    this.room = options.room
    this.documentId = options.documentId
    this.doc = options.doc
    this.sharedAccess = options.sharedAccess
    this.onSynced = options.onSynced

    this.join = this.join.bind(this)
    this.handleRemoteUpdate = this.handleRemoteUpdate.bind(this)
    this.handleLocalUpdate = this.handleLocalUpdate.bind(this)

    this.socket.on(SOCKET_EVENTS.YJS_SYNC_UPDATE, this.handleRemoteUpdate)
    this.doc.on('update', this.handleLocalUpdate)

    if (this.socket.connected) {
      this.join()
    } else {
      this.socket.once('connect', this.join)
    }
  }

  private join() {
    this.socket.emit(SOCKET_EVENTS.YJS_JOIN, {
      room: this.room,
      documentId: this.documentId,
      shareId: this.sharedAccess?.shareId,
      guestId: this.sharedAccess?.guestId,
      guestName: this.sharedAccess?.guestName,
    })
  }

  private handleRemoteUpdate(payload: YjsUpdatePayload) {
    if (payload.room !== this.room) return

    Y.applyUpdate(this.doc, Uint8Array.from(payload.update), this)

    if (!this.synced) {
      this.synced = true
      this.onSynced?.()
    }
  }

  private handleLocalUpdate(update: Uint8Array, origin: unknown) {
    if (origin === this) return

    this.socket.emit(SOCKET_EVENTS.YJS_SYNC_UPDATE, {
      room: this.room,
      update: Array.from(update),
    })
  }

  destroy() {
    this.socket.emit(SOCKET_EVENTS.YJS_LEAVE, {
      room: this.room,
    })

    this.socket.off(SOCKET_EVENTS.YJS_SYNC_UPDATE, this.handleRemoteUpdate)
    this.socket.off('connect', this.join)
    this.doc.off('update', this.handleLocalUpdate)
  }
}