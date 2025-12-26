import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// タスク更新スキーマ
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().nullable().optional().transform((str) => (str ? new Date(str) : null)),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// GET: タスク詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const task = await prisma.tasks.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: 'タスクが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status as 'not_started' | 'in_progress' | 'completed' | 'on_hold',
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: task.dueDate?.toISOString() || null,
        assignee: task.assignee || null,
        tags: task.tags ? JSON.parse(task.tags) : [],
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH: タスク更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateTaskSchema.parse(body)

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
    if (data.assignee !== undefined) updateData.assignee = data.assignee
    if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null

    const task = await prisma.tasks.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() || null,
        assignee: task.assignee,
        tags: task.tags ? JSON.parse(task.tags) : [],
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'タスクが見つかりません' }, { status: 404 })
    }
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'タスクの更新に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: タスク削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.tasks.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'タスクが見つかりません' }, { status: 404 })
    }
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'タスクの削除に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
