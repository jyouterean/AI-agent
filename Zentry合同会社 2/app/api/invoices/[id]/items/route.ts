import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceYen: z.number().int().positive(),
  taxRate: z.number().refine((n) => n === 0 || n === 0.08 || n === 0.1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = itemSchema.parse(body)

    const amountYen = data.quantity * data.unitPriceYen

    // 明細を追加
    const item = await prisma.invoice_items.create({
      data: {
        invoiceId: params.id,
        ...data,
        amountYen,
        taxRate: data.taxRate as number,
      },
    })

    // 請求書の合計を再計算
    const invoice = await prisma.invoices.findUnique({
      where: { id: params.id },
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
        where: { id: params.id },
        data: {
          subtotalYen,
          taxYen,
          totalYen: subtotalYen + taxYen,
        },
      })
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating invoice item:', error)
    return NextResponse.json({ error: 'Failed to create invoice item' }, { status: 500 })
  }
}

