import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const clientUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  invoiceRegNo: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          take: 5,
          orderBy: { issueDate: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = clientUpdateSchema.parse(body)

    const updateData: any = { ...data }
    if (updateData.email === '') {
      updateData.email = null
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(client)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.client.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}

