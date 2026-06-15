'use client'

// useMutation: 데이터를 변경하는 요청(POST, PUT, DELETE)
// useQueryClient: React Query의 전체 캐시 관리자

// useQuery → 데이터 가져오기, invalidateQueries → 다시 가져오기
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/fetcher'
import { queryKeys } from '@/lib/react-query/query-keys'
import type { CreateDocumentResponse } from '@/features/documents/types'

// 서버 데이터 변경 -> 캐시 무효화 -> UI 자동 업데이트로 이어지는 선순환 구조
export function useCreateDocument() {
  const queryClient = useQueryClient()

  // 데이터를 **생성, 수정, 삭제(Write)할 때 사용
  return useMutation({ // 실행 결과로 객체 반환 
    // 네트워크 요청을 수행하는 함수, 반드시 Promise를 반환해야 함.
    mutationFn: () =>
      fetcher<CreateDocumentResponse>('/api/documents', {
        method: 'POST',
      }),
      // 데이터 동기화는 onSuccess, UI 제어는 호출하는 곳의 mutateAsync에서 처리
    onSuccess: () => {
      // invalidateQueries를 사용하면 React Query는 queryKeys.documents라는 키를 가진 모든 쿼리를 '부적격' 상태로 표시
      // -> 부적격 상태가 된 데이터는 화면에서 즉시 자동으로 다시요청(Refetch)되어,
      //    사용자는 새로고침 버튼을 누르지않아도 방금 만든 문서가 포함된 최신목록을 보게 됨.
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
    },
  })
}