// export const SOCKET_EVENTS = {
//   DOCUMENT_JOIN: 'document:join',
//   DOCUMENT_LEAVE: 'document:leave',

//   TITLE_UPDATE: 'title:update',

//   BODY_CURSOR_UPDATE: 'body:cursor:update',
//   TITLE_CURSOR_UPDATE: 'title:cursor:update',

//   PRESENCE_UPDATE: 'presence:update',
// } as const // as const = 값이 안 변하는 정확한 상수라고 더 강하게 알려주는 문법

export const SOCKET_EVENTS = {
  YJS_JOIN: 'yjs:join',
  YJS_LEAVE: 'yjs:leave',
  YJS_SYNC_UPDATE: 'yjs:sync:update',
  YJS_AWARENESS_UPDATE: 'yjs:awareness:update',
} as const