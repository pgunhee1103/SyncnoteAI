'use client'

import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import { queryKeys } from '@/lib/react-query/query-keys'
import type { DocumentsResponse } from '@/features/documents/types'

export function useDocumentsQuery() {
  return useQuery({
    queryKey: queryKeys.documents, // 데이터의 이름표 (캐시 키)
    queryFn: () => fetcher<DocumentsResponse>('/api/documents'), // 데이터를 가져오는 방법
  })
}

// TanStack Query(React Query)란 무엇인가?
// 기존에는 데이터를 가져올 때 useEffect와 fetch를 쓰고, 로딩 상태를 관리하기 위해 useState를 직접 다 만들었지만 TanStack Query를 쓰면 이 모든 과정을 자동화

// 핵심 기능 3가지
// 캐싱(Caching): 한 번 가져온 데이터는 메모리에 저장해둠. 사용자가 다른 페이지에 갔다가 돌아왔을 때, 서버에 다시 물어보지 않고 저장된 데이터를 즉시 보여줘서 앱이 엄청 빨라 보입니다.

// 상태 관리: "지금 데이터를 가져오는 중인가?(isLoading)", "에러가 났는가?(isError)", "데이터가 도착했는가?(data)"를 알아서 알려줌

// 자동 새로고침: 사용자가 브라우저 창을 다시 클릭하거나, 인터넷이 끊겼다 연결되면 데이터를 자동으로 최신화