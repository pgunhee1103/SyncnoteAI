// 프론트에서 API 호출할 때 쓰는 표준 함수
export async function fetcher<T>(
  // 제네릭 T: 이 함수가 어떤 타입을 반환할지 호출하는 쪽에서 정한다
  input: RequestInfo | URL,
  init?: RequestInit, // 옵션(method, headers 등)
): Promise<T> {
  const res = await fetch(input, { // api 호출
    ...init, // 넘겨받은 옵션들 그대로 복사
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}), // init.headers가 있으면 그것도 합쳐라
    },
  })
  // 응답 JSON 파싱
  const data = await res.json().catch(() => null) // 서버가 JSON 안 줄 수도 있어서 안전하게 처리

  // res.ok = HTTP 상태코드 200~299
  if (!res.ok) {
    throw new Error(data?.message ?? '요청 처리 중 오류가 발생했습니다.')
    // throw 하면 이 함수 쓴 쪽에서 try/catch로 잡음
  }
  // 이 데이터는 T 타입이라고 믿고 쓰겠다
  return data as T
}