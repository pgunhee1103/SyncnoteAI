'use client'

import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay = 800) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer) // 사용자가 계속 타이핑하면 이전 타이머 취소 => 마지막 입력만 반영됨
  }, [value, delay])

  return debouncedValue
}