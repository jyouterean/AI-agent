import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const invoiceUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid']).optional(),
  issueDate: z.string().transform((str) => new Date(str)).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional(),
  bankAccount: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = invoiceUpdateSchema.parse(body)

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data,
      include: {
        client: true,
        items: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}

