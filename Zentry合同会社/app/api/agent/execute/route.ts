import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import dayjs from 'dayjs'

const executeSchema = z.object({
  action: z.enum([
    'create_transaction',
    'create_invoice_draft',
    'add_invoice_item',
    'search_client',
    'create_client',
    'update_invoice_status',
    'update_transaction',
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

