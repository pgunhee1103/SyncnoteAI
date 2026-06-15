//파일 삭제예정(다른파일에서 사용중인지 확인 필요)
const roomDocuments = new Map<string, string>()

export function getRoomContent(documentId: string) {
  return roomDocuments.get(documentId)
}

export function setRoomContent(documentId: string, content: string) {
  roomDocuments.set(documentId, content)
}

export function clearRoomContent(documentId: string) {
  roomDocuments.delete(documentId)
}