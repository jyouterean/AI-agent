import { NextRequest, NextResponse } from 'next/server'
import { NotionProvider } from '@/lib/ai/providers/notion'
import { z } from 'zod'

// タスク作成スキーマ
const createTaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// GET: タスク一覧取得
export async function GET(request: NextRequest) {
  try {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_TASKS_DATABASE_ID) {
      return NextResponse.json(
        { error: 'Notion API key or Tasks Database ID is not configured' },
        { status: 400 }
      )
    }

    const notionProvider = new NotionProvider({
      apiKey: process.env.NOTION_API_KEY,
      databaseId: process.env.NOTION_TASKS_DATABASE_ID,
    })

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    // フィルターを構築
    let filter: any = undefined
    if (status || priority) {
      filter = {
        and: [
          ...(status ? [{ property: 'Status', select: { equals: status } }] : []),
          ...(priority ? [{ property: 'Priority', select: { equals: priority } }] : []),
        ],
      }
    }

    const results = await notionProvider.queryDatabase(
      process.env.NOTION_TASKS_DATABASE_ID,
      filter ? { filter } : undefined
    )

    // タスクデータを整形
    const tasks = results.results.map((page: any) => {
      const props = page.properties || {}
      return {
        id: page.id,
        title: props.Title?.title?.[0]?.text?.content || '',
        description: props.Description?.rich_text?.[0]?.text?.content || '',
        status: props.Status?.select?.name || 'not_started',
        priority: props.Priority?.select?.name || 'medium',
        dueDate: props['Due Date']?.date?.start || null,
        assignee: props.Assignee?.people?.[0]?.name || null,
        tags: props.Tags?.multi_select?.map((tag: any) => tag.name) || [],
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
        url: `https://notion.so/${page.id.replace(/-/g, '')}`,
      }
    })

    return NextResponse.json({ success: true, data: tasks })
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
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_TASKS_DATABASE_ID) {
      return NextResponse.json(
        { error: 'Notion API key or Tasks Database ID is not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = createTaskSchema.parse(body)

    const notionProvider = new NotionProvider({
      apiKey: process.env.NOTION_API_KEY,
      databaseId: process.env.NOTION_TASKS_DATABASE_ID,
    })

    // Notionプロパティを構築
    const properties: Record<string, any> = {
      Title: {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      },
    }

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
    }

    if (data.status) {
      properties.Status = {
        select: {
          name: data.status,
        },
      }
    }

    if (data.priority) {
      properties.Priority = {
        select: {
          name: data.priority,
        },
      }
    }

    if (data.dueDate) {
      properties['Due Date'] = {
        date: {
          start: data.dueDate,
        },
      }
    }

    if (data.tags && data.tags.length > 0) {
      properties.Tags = {
        multi_select: data.tags.map((tag) => ({ name: tag })),
      }
    }

    const page = await notionProvider.createPage(process.env.NOTION_TASKS_DATABASE_ID, properties)

    const pageUrl = `https://notion.so/${page.id.replace(/-/g, '')}`

    return NextResponse.json({
      success: true,
      data: {
        id: page.id,
        title: data.title,
        url: pageUrl,
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

