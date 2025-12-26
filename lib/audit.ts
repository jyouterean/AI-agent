import { prisma } from './prisma'
import { getCurrentUser } from './auth'

export interface AuditLogData {
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// 操作ログを記録
export async function logAudit(data: AuditLogData & { userId?: string }) {
  try {
    let userId = data.userId
    if (!userId) {
      const user = await getCurrentUser()
      if (!user) {
        return // ログインしていない場合は記録しない
      }
      userId = user.id
    }

    await prisma.audit_logs.create({
      data: {
        userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    console.error('Error logging audit:', error)
    // エラーが発生しても処理を続行
  }
}

// 操作ログを取得
export async function getAuditLogs(filters?: {
  userId?: string
  action?: string
  entityType?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const where: any = {}

  if (filters?.userId) {
    where.userId = filters.userId
  }
  if (filters?.action) {
    where.action = filters.action
  }
  if (filters?.entityType) {
    where.entityType = filters.entityType
  }
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  return prisma.audit_logs.findMany({
    where,
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
  })
}

