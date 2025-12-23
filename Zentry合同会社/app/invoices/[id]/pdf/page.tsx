import { prisma } from '@/lib/prisma'
import InvoicePDF from '@/components/InvoicePDF'
import { notFound } from 'next/navigation'

export default async function InvoicePDFPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
    },
  })

  if (!invoice) {
    notFound()
  }

  return <InvoicePDF invoice={invoice} />
}

