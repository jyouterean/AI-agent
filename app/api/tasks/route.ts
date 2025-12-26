import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// タスク作成スキーマ
const createTaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional().transform((str) => (str ? new Date(str) : null)),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// GET: タスク一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    // フィルターを構築
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }

    const tasks = await prisma.tasks.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // タスクデータを整形（tagsをJSONから配列に変換）
    const formattedTasks = tasks.map((task) => ({
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
    }))

    return NextResponse.json({ success: true, data: formattedTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: タスク作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTaskSchema.parse(body)

    const task = await prisma.tasks.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'not_started',
        priority: data.priority || 'medium',
        dueDate: data.dueDate || null,
        assignee: data.assignee,
        tags: data.tags ? JSON.stringify(data.tags) : null,
      },
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
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'タスクの作成に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
