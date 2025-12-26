import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { hashPassword } from '@/lib/auth'
import { shouldSkipAuth } from '@/lib/auth-helper'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  name: z.string().min(1),
  role: z.enum(['admin', 'employee']).optional(),
})

// GET: 従業員一覧取得（管理者のみ）
export async function GET(request: NextRequest) {
  try {
    let user = null
    if (!shouldSkipAuth()) {
      user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: '認証されていません' }, { status: 401 })
      }
      if (user.role !== 'admin') {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: '従業員一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 従業員作成（管理者のみ）
export async function POST(request: NextRequest) {
  try {
    let user = null
    if (!shouldSkipAuth()) {
      user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: '認証されていません' }, { status: 401 })
      }
      if (user.role !== 'admin') {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // メールアドレスの重複チェック
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(data.password)

    const newUser = await prisma.users.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role || 'employee',
        createdBy: user?.id || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    // 操作ログを記録
    if (user) {
      await logAudit({
        userId: user.id,
        action: 'create_user',
        entityType: 'user',
        entityId: newUser.id,
        details: { email: newUser.email, name: newUser.name, role: newUser.role },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
    }

    return NextResponse.json({ success: true, data: newUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: '従業員の作成に失敗しました' },
      { status: 500 }
    )
  }
}

