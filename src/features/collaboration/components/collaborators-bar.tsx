//파일 삭제예정(다른파일에서 사용중인지 확인 필요)
'use client'

import type { CollaboratorPresence } from '@/features/collaboration/types'

type Props = {
  users: CollaboratorPresence[]
}

export function CollaboratorsBar({ users }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {users.length === 0 ? (
        <span className="text-xs text-gray-500">접속자 없음</span>
      ) : (
        users.map((user) => (
          <div
            key={user.socketId}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="font-medium">{user.displayName}</span>
          </div>
        ))
      )}
    </div>
  )
}