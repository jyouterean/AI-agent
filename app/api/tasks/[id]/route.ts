import { NextRequest, NextResponse } from 'next/server'
import { NotionProvider } from '@/lib/ai/providers/notion'
import { z } from 'zod'

// タスク更新スキーマ
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().nullable().optional(),
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

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json({ error: 'Notion API key is not configured' }, { status: 400 })
    }

    const notionProvider = new NotionProvider({
      apiKey: process.env.NOTION_API_KEY,
    })

    const page = await notionProvider.getPage(id)
    const props = (page as any).properties || {}

    const task = {
      id: page.id,
      title: props.Title?.title?.[0]?.text?.content || '',
      description: props.Description?.rich_text?.[0]?.text?.content || '',
      status: props.Status?.select?.name || 'not_started',
      priority: props.Priority?.select?.name || 'medium',
      dueDate: props['Due Date']?.date?.start || null,
      assignee: props.Assignee?.people?.[0]?.name || null,
      tags: props.Tags?.multi_select?.map((tag: any) => tag.name) || [],
      createdAt: (page as any).created_time,
      updatedAt: (page as any).last_edited_time,
      url: `https://notion.so/${page.id.replace(/-/g, '')}`,
    }

    return NextResponse.json({ success: true, data: task })
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

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json({ error: 'Notion API key is not configured' }, { status: 400 })
    }

    const notionProvider = new NotionProvider({
      apiKey: process.env.NOTION_API_KEY,
    })

    // Notionプロパティを構築
    const properties: Record<string, any> = {}

    if (data.title !== undefined) {
      properties.Title = {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      }
    }

    if (data.description !== undefined) {
      if (data.description) {
        properties.Description = {
          rich_text: [
            {
              text: {
                content: data.description,
              },
            },
          ],
        }
      } else {
        properties.Description = {
          rich_text: [],
        }
      }
    }

    if (data.status !== undefined) {
      properties.Status = {
        select: {
          name: data.status,
        },
      }
    }

    if (data.priority !== undefined) {
      properties.Priority = {
        select: {
          name: data.priority,
        },
      }
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate) {
        properties['Due Date'] = {
          date: {
            start: data.dueDate,
          },
        }
      } else {
        properties['Due Date'] = {
          date: null,
        }
      }
    }

    if (data.tags !== undefined) {
      properties.Tags = {
        multi_select: data.tags.map((tag) => ({ name: tag })),
      }
    }

    await notionProvider.updatePage(id, properties)

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
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

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json({ error: 'Notion API key is not configured' }, { status: 400 })
    }

    const notionProvider = new NotionProvider({
      apiKey: process.env.NOTION_API_KEY,
    })

    // Notion APIでは直接削除できないため、アーカイブ（削除済みとしてマーク）
    await notionProvider.archivePage(id)

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'タスクの削除に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

