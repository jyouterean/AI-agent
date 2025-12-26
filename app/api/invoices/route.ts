import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const invoiceSchema = z.object({
  clientId: z.string(),
  issueDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  status: z.enum(['draft', 'sent', 'paid']).default('draft'),
  notes: z.string().optional(),
  bankAccount: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const invoices = await prisma.invoices.findMany({
      include: {
        clients: true,
        invoice_items: true,
      },
      orderBy: { issueDate: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 })
    }

    const body = await request.json()
    const data = invoiceSchema.parse(body)

    // 初期値で請求書を作成（明細は後で追加）
    const invoice = await prisma.invoices.create({
      data: {
        ...data,
        subtotalYen: 0,
        taxYen: 0,
        totalYen: 0,
        createdBy: user.id,
      },
      include: {
        clients: true,
        invoice_items: true,
      },
    })

    // 操作ログを記録
    await logAudit({
      action: 'create_invoice',
      entityType: 'invoice',
      entityId: invoice.id,
      details: { clientId: invoice.clientId, status: invoice.status },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

