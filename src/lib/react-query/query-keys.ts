// // 데이터를 찾기 위한 표준화된 이름표 -> 데이터를 재사용하거나, 데이터가 변했을 때 특정 데이터만 골라서 새로고침 가능
// export const queryKeys = {
//   // 간단한 상수 키(목록 조회용)
//   me: ['me'] as const,
//   documents: ['documents'] as const,
//   // 파라미터가 필요한 동적 키 (상세 조회용)
//   // 함수로 만드는 이유:  동적 생성: queryKeys.documentMeta('abc')라고 호출하면 ['documents', 'abc', 'meta']라는 이름표를 바로 만듦
//   //                   타입 안정성: documentId: string이라고 타입을 지정함 -> 실수로 숫자 / 빈 값을 넣으면 코드를 실행하기도 전에 빨간 줄로 경고
//   documentMeta: (documentId: string) =>
//     ['documents', documentId, 'meta'] as const,
// }

export const queryKeys = {
  me: ['me'] as const,
  documents: ['documents'] as const,
  documentMeta: (documentId: string) =>
    ['documents', documentId, 'meta'] as const,
}