import { NextRequest, NextResponse } from 'next/server'
import { logout, getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { shouldSkipAuth } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let user = null
    if (!shouldSkipAuth()) {
      user = await getCurrentUser()
      
      if (user) {
        // ログアウト操作を記録
        await logAudit({
          userId: user.id,
          action: 'logout',
          entityType: 'user',
          entityId: user.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        })
      }
    }

    await logout()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    )
  }
}
