'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message ?? '로그인 실패')
        return
      }

      router.push('/documents')
      router.refresh()
    } catch {
      setMessage('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">로그인</h1>
          <p className="text-sm text-gray-500">
            SyncNote AI에 로그인하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">이메일</label>
            <input
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-900"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">비밀번호</label>
            <input
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-900"
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {message ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {message}
            </p>
          ) : null}
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          계정이 없나요?{' '}
          <Link href="/register" className="font-medium text-gray-900 underline">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}