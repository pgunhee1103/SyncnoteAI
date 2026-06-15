import { z } from 'zod'
import { prisma } from '@/server/db/prisma'
import { hashPassword, verifyPassword } from '@/server/auth/password'
import type { LoginInput, RegisterInput, SafeUser } from '@/features/auth/types'

const registerSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  displayName: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상이어야 합니다.')
    .max(30, '이름은 30자 이하여야 합니다.'),
})

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

function toSafeUser(user: {
  id: string
  email: string
  displayName: string
  createdAt: Date
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  }
}

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const parsed = registerSchema.parse(input)

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: { id: true },
  })

  if (existingUser) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  const passwordHash = await hashPassword(parsed.password)

  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash,
      displayName: parsed.displayName,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
  })

  return toSafeUser(user)
}

export async function loginUser(input: LoginInput): Promise<SafeUser> {
  const parsed = loginSchema.parse(input)

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      passwordHash: true,
    },
  })

  if (!user) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  const isPasswordValid = await verifyPassword(parsed.password, user.passwordHash)

  if (!isPasswordValid) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  return toSafeUser(user)
}