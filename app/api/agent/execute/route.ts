import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import dayjs from 'dayjs'
import { NotionProvider } from '@/lib/ai/providers/notion'

const executeSchema = z.object({
  action: z.enum([
    'create_transaction',
    'create_invoice_draft',
    'add_invoice_item',
    'search_client',
    'create_client',
    'update_invoice_status',
    'update_transaction',
    'save_to_notion',
    'search_notion',
    'create_task',
    'update_task',
    'search_task',
  ]),
  params: z.record(z.any()),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, params } = executeSchema.parse(body)

    switch (action) {
      case 'create_transaction': {
        const transactionSchema = z.object({
          type: z.enum(['income', 'expense']),
          date: z.string().transform((str) => new Date(str)),
          accountCategory: z.string().min(1),
          partnerName: z.string().min(1),
          amountYen: z.number().int().positive(),
          memo: z.string().optional(),
        })

        const data = transactionSchema.parse(params)
        const transaction = await prisma.transactions.create({ data })

        return NextResponse.json({ success: true, data: transaction })
      }

      case 'create_invoice_draft': {
        const invoiceSchema = z.object({
          clientName: z.string().min(1),
          issueDate: z.string().transform((str) => new Date(str)),
          dueDate: z.string().transform((str) => new Date(str)).optional(),
          notes: z.string().optional(),
          bankAccount: z.string().optional(),
        })

        const data = invoiceSchema.parse(params)

        // 顧客を検索または作成
        let client = await prisma.clients.findFirst({
          where: { name: { contains: data.clientName } },
        })

        if (!client) {
          client = await prisma.clients.create({
            data: { name: data.clientName },
          })
        }

        const invoice = await prisma.invoices.create({
          data: {
            clientId: client.id,
            issueDate: data.issueDate,
            dueDate: data.dueDate || dayjs(data.issueDate).add(30, 'day').toDate(),
            status: 'draft',
            subtotalYen: 0,
            taxYen: 0,
            totalYen: 0,
            notes: data.notes,
            bankAccount: data.bankAccount,
          },
          include: {
            clients: true,
            invoice_items: true,
          },
        })

        return NextResponse.json({ success: true, data: invoice })
      }

      case 'add_invoice_item': {
        const itemSchema = z.object({
          invoiceId: z.string(),
          description: z.string().min(1),
          quantity: z.number().int().positive(),
          unitPriceYen: z.number().int().positive(),
          taxRate: z.number().refine((n) => n === 0 || n === 0.08 || n === 0.1),
        })

        const data = itemSchema.parse(params)
        const amountYen = data.quantity * data.unitPriceYen

        const item = await prisma.invoice_items.create({
          data: {
            invoiceId: data.invoiceId,
            description: data.description,
            quantity: data.quantity,
            unitPriceYen: data.unitPriceYen,
            amountYen,
            taxRate: data.taxRate,
          },
        })

        // 請求書の合計を再計算
        const invoice = await prisma.invoices.findUnique({
          where: { id: data.invoiceId },
          include: { invoice_items: true },
        })

        if (invoice) {
          let subtotalYen = 0
          let taxYen = 0

          for (const item of invoice.invoice_items) {
            const itemSubtotal = item.amountYen
            const itemTax = Math.floor(itemSubtotal * item.taxRate)
            subtotalYen += itemSubtotal
            taxYen += itemTax
          }

          await prisma.invoices.update({
            where: { id: data.invoiceId },
            data: {
              subtotalYen,
              taxYen,
              totalYen: subtotalYen + taxYen,
            },
          })
        }

        return NextResponse.json({ success: true, data: item })
      }

      case 'search_client': {
        const searchSchema = z.object({
          name: z.string().min(1),
        })

        const data = searchSchema.parse(params)

        const clients = await prisma.clients.findMany({
          where: {
            name: {
              contains: data.name,
            },
          },
          take: 10,
        })

        return NextResponse.json({ success: true, data: clients })
      }

      case 'create_client': {
        const clientSchema = z.object({
          name: z.string().min(1),
          email: z.string().email().optional().or(z.literal('')),
          address: z.string().optional(),
          invoiceRegNo: z.string().optional(),
        })

        const data = clientSchema.parse(params)

        const client = await prisma.clients.create({
          data: {
            name: data.name,
            email: data.email || undefined,
            address: data.address,
            invoiceRegNo: data.invoiceRegNo,
          },
        })

        return NextResponse.json({ success: true, data: client })
      }

      case 'update_invoice_status': {
        const updateSchema = z.object({
          invoiceId: z.string(),
          status: z.enum(['draft', 'sent', 'paid']),
        })

        const data = updateSchema.parse(params)

        const invoice = await prisma.invoices.update({
          where: { id: data.invoiceId },
          data: { status: data.status },
          include: { clients: true, invoice_items: true },
        })

        return NextResponse.json({ success: true, data: invoice })
      }

      case 'update_transaction': {
        const updateSchema = z.object({
          id: z.string(),
          type: z.enum(['income', 'expense']).optional(),
          date: z.string().transform((str) => new Date(str)).optional(),
          accountCategory: z.string().optional(),
          partnerName: z.string().optional(),
          amountYen: z.number().int().positive().optional(),
          memo: z.string().optional(),
        })

        const data = updateSchema.parse(params)

        const { id, ...updateFields } = data

        const transaction = await prisma.transactions.update({
          where: { id },
          data: updateFields,
        })

        return NextResponse.json({ success: true, data: transaction })
      }

      case 'save_to_notion': {
        if (!process.env.NOTION_API_KEY) {
          return NextResponse.json({ error: 'Notion API key is not configured' }, { status: 400 })
        }

        const notionSchema = z.object({
          databaseId: z.string().min(1).optional(),
          title: z.string().min(1),
          content: z.string().optional(),
          properties: z.record(z.any()).optional(),
        })

        const data = notionSchema.parse(params)
        const databaseId = data.databaseId || process.env.NOTION_DATABASE_ID

        if (!databaseId) {
          return NextResponse.json({ error: 'Notion database ID is required' }, { status: 400 })
        }

        const notionProvider = new NotionProvider({
          apiKey: process.env.NOTION_API_KEY,
        })

        const properties: Record<string, any> = {
          title: {
            title: [
              {
                text: {
                  content: data.title,
                },
              },
            ],
          },
          ...data.properties,
        }

        const page = await notionProvider.createPage(databaseId, properties)

        // Notion APIのレスポンスからURLを構築
        const pageUrl = `https://notion.so/${page.id.replace(/-/g, '')}`
        return NextResponse.json({ success: true, data: { pageId: page.id, url: pageUrl } })
      }

      case 'search_notion': {
        if (!process.env.NOTION_API_KEY) {
          return NextResponse.json({ error: 'Notion API key is not configured' }, { status: 400 })
        }

        const searchSchema = z.object({
          databaseId: z.string().min(1).optional(),
          query: z.string().min(1),
        })

        const data = searchSchema.parse(params)
        const databaseId = data.databaseId || process.env.NOTION_DATABASE_ID

        if (!databaseId) {
          return NextResponse.json({ error: 'Notion database ID is required' }, { status: 400 })
        }

        const notionProvider = new NotionProvider({
          apiKey: process.env.NOTION_API_KEY,
        })

        // 簡易的な検索（実際の実装では、より高度な検索を実装）
        const results = await notionProvider.queryDatabase(databaseId, {
          property: 'title',
          title: {
            contains: data.query,
          },
        })

        return NextResponse.json({
          success: true,
          data: {
            results: results.results.map((page: any) => ({
              id: page.id,
              url: page.url,
              properties: page.properties,
            })),
          },
        })
      }

      case 'create_task': {
        const taskSchema = z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
          priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
          dueDate: z.string().optional().transform((str) => (str ? new Date(str) : null)),
          tags: z.array(z.string()).optional(),
        })

        const data = taskSchema.parse(params)

        const task = await prisma.tasks.create({
          data: {
            title: data.title,
            description: data.description,
            status: data.status || 'not_started',
            priority: data.priority || 'medium',
            dueDate: data.dueDate || null,
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
            tags: task.tags ? JSON.parse(task.tags) : [],
          },
        })
      }

      case 'update_task': {
        const taskSchema = z.object({
          id: z.string().min(1),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
          priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
          dueDate: z.string().nullable().optional().transform((str) => (str ? new Date(str) : null)),
          tags: z.array(z.string()).optional(),
        })

        const data = taskSchema.parse(params)

        const updateData: any = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.status !== undefined) updateData.status = data.status
        if (data.priority !== undefined) updateData.priority = data.priority
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
        if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null

        const task = await prisma.tasks.update({
          where: { id: data.id },
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
            tags: task.tags ? JSON.parse(task.tags) : [],
          },
        })
      }

      case 'search_task': {
        const searchSchema = z.object({
          query: z.string().optional(),
          status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
          priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        })

        const data = searchSchema.parse(params)

        // フィルターを構築
        const where: any = {}
        if (data.status) {
          where.status = data.status
        }
        if (data.priority) {
          where.priority = data.priority
        }
        if (data.query) {
          where.title = { contains: data.query, mode: 'insensitive' }
        }

        const tasks = await prisma.tasks.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })

        // タスクデータを整形
        const formattedTasks = tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() || null,
          tags: task.tags ? JSON.parse(task.tags) : [],
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        }))

        return NextResponse.json({
          success: true,
          data: {
            results: formattedTasks,
            count: formattedTasks.length,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error executing action:', error)
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 })
  }
}

