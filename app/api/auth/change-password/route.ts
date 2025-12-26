import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { shouldSkipAuth } from '@/lib/auth-helper'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'パスワードは8文字以上である必要があります'),
})

export async function POST(request: NextRequest) {
  try {
    let user = null
    if (!shouldSkipAuth()) {
      user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: '認証されていません' }, { status: 401 })
      }
    } else {
      // 認証が無効化されている場合は、最初のユーザーを使用（開発用）
      const firstUser = await prisma.users.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
      if (firstUser) {
        user = { id: firstUser.id } as any
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // 現在のパスワードを確認
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const isValid = await verifyPassword(currentPassword, dbUser.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 })
    }

    // 新しいパスワードをハッシュ化して更新
    const newPasswordHash = await hashPassword(newPassword)
    await prisma.users.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    // 操作ログを記録
    await logAudit({
      userId: user.id,
      action: 'change_password',
      entityType: 'user',
      entityId: user.id,
      details: {},
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, message: 'パスワードを変更しました' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'パスワードの変更に失敗しました' },
      { status: 500 }
    )
  }
}

