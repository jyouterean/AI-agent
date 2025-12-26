import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { hashPassword } from '@/lib/auth'
import { shouldSkipAuth } from '@/lib/auth-helper'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'employee']).optional(),
  isActive: z.boolean().optional(),
})

// GET: 従業員詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = null
    if (!shouldSkipAuth()) {
      user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: '認証されていません' }, { status: 401 })
      }
    }

    const { id } = await params

    // 管理者または本人のみアクセス可能
    if (!shouldSkipAuth() && user && user.role !== 'admin' && user.id !== id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const targetUser = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: '従業員が見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: targetUser })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: '従業員情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH: 従業員更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = null
    if (!shouldSkipAuth()) {
      user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: '認証されていません' }, { status: 401 })
      }
    }

    const { id } = await params
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // 管理者のみ更新可能（本人は一部のみ更新可能）
    if (!shouldSkipAuth() && user && user.role !== 'admin' && user.id !== id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // 本人の場合はroleとisActiveは変更不可
    if (!shouldSkipAuth() && user && user.id === id && user.role !== 'admin') {
      if (data.role !== undefined || data.isActive !== undefined) {
        return NextResponse.json(
          { error: '自分の権限やステータスは変更できません' },
          { status: 403 }
        )
      }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.password !== undefined) {
      updateData.passwordHash = await hashPassword(data.password)
    }

    const updatedUser = await prisma.users.update({
      where: { id },
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
        action: 'update_user',
        entityType: 'user',
        entityId: id,
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
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: '従業員が見つかりません' }, { status: 404 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: '従業員の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 従業員削除（無効化）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // 自分自身は削除できない
    if (!shouldSkipAuth() && user && user.id === id) {
      return NextResponse.json(
        { error: '自分自身を削除することはできません' },
        { status: 400 }
      )
    }

    // 削除ではなく無効化
    const updatedUser = await prisma.users.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    })

    // 操作ログを記録
    if (user) {
      await logAudit({
        userId: user.id,
        action: 'delete_user',
        entityType: 'user',
        entityId: id,
        details: { email: updatedUser.email, name: updatedUser.name },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
    }

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: '従業員が見つかりません' }, { status: 404 })
    }
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: '従業員の削除に失敗しました' },
      { status: 500 }
    )
  }
}

