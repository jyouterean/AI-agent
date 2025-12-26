import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // ユーザーを検索
    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      console.log('Login failed: User not found or inactive', { email })
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // パスワードを検証
    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      console.log('Login failed: Invalid password', { email })
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // セッションを作成
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const sessionValue = `${user.id}_${sessionId}`

    // Cookieに保存
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set('zentry_session', sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7日
      path: '/',
    })

    // ログイン操作を記録（ユーザーIDを直接渡す）
    try {
      await logAudit({
        userId: user.id,
        action: 'login',
        entityType: 'user',
        entityId: user.id,
        details: { email: user.email },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
    } catch (auditError) {
      console.error('Error logging audit:', auditError)
      // 監査ログのエラーは無視して続行
    }

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}

