import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  accountCategory: z.string().min(1).optional(),
  partnerName: z.string().min(1).optional(),
  amountYen: z.number().int().positive().optional(),
  memo: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaction = await prisma.transactions.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = transactionSchema.parse(body)

    const updateData: any = { ...data }
    if (updateData.attachmentUrl === '') {
      updateData.attachmentUrl = null
    }

    const transaction = await prisma.transactions.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(transaction)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.transactions.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

