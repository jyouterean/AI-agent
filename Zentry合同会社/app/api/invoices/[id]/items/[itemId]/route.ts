import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const itemUpdateSchema = z.object({
  description: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  unitPriceYen: z.number().int().positive().optional(),
  taxRate: z.number().refine((n) => n === 0 || n === 0.08 || n === 0.1).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await request.json()
    const data = itemUpdateSchema.parse(body)

    const updateData: any = { ...data }
    if (updateData.quantity !== undefined && updateData.unitPriceYen !== undefined) {
      updateData.amountYen = updateData.quantity * updateData.unitPriceYen
    } else if (updateData.quantity !== undefined) {
      const item = await prisma.invoice_items.findUnique({ where: { id: params.itemId } })
      if (item) {
        updateData.amountYen = updateData.quantity * item.unitPriceYen
      }
    } else if (updateData.unitPriceYen !== undefined) {
      const item = await prisma.invoice_items.findUnique({ where: { id: params.itemId } })
      if (item) {
        updateData.amountYen = item.quantity * updateData.unitPriceYen
      }
    }

    const item = await prisma.invoice_items.update({
      where: { id: params.itemId },
      data: updateData,
    })

    // 請求書の合計を再計算
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { invoice_items: true },
    })

    if (invoice) {
      let subtotalYen = 0
      let taxYen = 0

      for (const invItem of invoice.items) {
        const itemSubtotal = invItem.amountYen
        const itemTax = Math.floor(itemSubtotal * invItem.taxRate)
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

    return NextResponse.json(item)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice item not found' }, { status: 404 })
    }
    console.error('Error updating invoice item:', error)
    return NextResponse.json({ error: 'Failed to update invoice item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    await prisma.invoice_items.delete({
      where: { id: params.itemId },
    })

    // 請求書の合計を再計算
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { invoice_items: true },
    })

    if (invoice) {
      let subtotalYen = 0
      let taxYen = 0

      for (const item of invoice.items) {
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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice item not found' }, { status: 404 })
    }
    console.error('Error deleting invoice item:', error)
    return NextResponse.json({ error: 'Failed to delete invoice item' }, { status: 500 })
  }
}
