export type SafeUser = {
  id: string
  email: string
  displayName: string
  createdAt: Date
}

export type RegisterInput = {
  email: string
  password: string
  displayName: string
}

export type LoginInput = {
  email: string
  password: string
}