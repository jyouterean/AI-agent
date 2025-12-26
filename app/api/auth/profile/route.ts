import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { shouldSkipAuth } from '@/lib/auth-helper'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
})

// GET: プロフィール取得
export async function GET(request: NextRequest) {
  try {
    // 認証が無効化されている場合は、最初のユーザーを返す（開発用）
    let userId: string | null = null
    if (shouldSkipAuth()) {
      const firstUser = await prisma.users.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
      userId = firstUser?.id || null
    } else {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: '認証されていません' }, { status: 401 })
      }
      userId = user.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const dbUser = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: dbUser })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'プロフィールの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH: プロフィール更新
export async function PATCH(request: NextRequest) {
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
        select: { id: true, email: true },
      })
      if (firstUser) {
        user = { id: firstUser.id, email: firstUser.email } as any
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    // メールアドレスの重複チェック
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.users.findUnique({
        where: { email: data.email },
      })
      if (existingUser) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email

    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    // 操作ログを記録
    if (user) {
      await logAudit({
        userId: user.id,
        action: 'update_profile',
        entityType: 'user',
        entityId: user.id,
        details: updateData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
    }

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    )
  }
}
