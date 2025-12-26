import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'employee'
  isActive: boolean
}

const SESSION_COOKIE_NAME = 'zentry_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7日

// パスワードをハッシュ化
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// パスワードを検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// セッションを作成
export async function createSession(userId: string): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  // セッションをデータベースに保存（簡易実装：実際にはセッションテーブルを作成する）
  // 今回はcookieに直接保存する簡易実装
  return sessionId
}

// 現在のユーザーを取得
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionId) {
      return null
    }

    // セッションIDからユーザーIDを取得（簡易実装）
    // 実際にはセッションテーブルから取得する
    const userId = sessionId.split('_')[1] // 簡易実装

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return null
    }

    return user as User
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// ログイン
export async function login(email: string, password: string): Promise<User | null> {
  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user || !user.isActive) {
    return null
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return null
  }

  // セッションを作成
  const sessionId = await createSession(user.id)

  // Cookieに保存
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, `${user.id}_${sessionId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'admin' | 'employee',
    isActive: user.isActive,
  }
}

// ログアウト
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

