import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  invoiceRegNo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const clients = await prisma.clients.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 })
    }

    const body = await request.json()
    const data = clientSchema.parse(body)

    const client = await prisma.clients.create({
      data: {
        ...data,
        email: data.email || undefined,
        createdBy: user.id,
      },
    })

    // 操作ログを記録
    await logAudit({
      action: 'create_client',
      entityType: 'client',
      entityId: client.id,
      details: { name: client.name, email: client.email },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

