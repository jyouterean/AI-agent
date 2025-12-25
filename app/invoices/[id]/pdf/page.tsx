import { prisma } from '@/lib/prisma'
import InvoicePDF from '@/components/InvoicePDF'
import { notFound } from 'next/navigation'

export default async function InvoicePDFPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await prisma.invoices.findUnique({
    where: { id },
    include: {
      clients: true,
      invoice_items: true,
    },
  })

  if (!invoice) {
    notFound()
  }

  // 会社情報を環境変数から取得
  const companyInfo = {
    name: process.env.COMPANY_NAME || '株式会社○○カンパニー',
    address: process.env.COMPANY_ADDRESS || '〒XXX-XXXX\n東京都新宿区西新宿\n西新宿○○カンパニービル',
    phone: process.env.COMPANY_PHONE ? `TEL: ${process.env.COMPANY_PHONE}` : '',
    fax: process.env.COMPANY_FAX ? `FAX: ${process.env.COMPANY_FAX}` : '',
    email: process.env.COMPANY_EMAIL ? `E-Mail: ${process.env.COMPANY_EMAIL}` : '',
    contact: process.env.COMPANY_CONTACT ? `担当者: ${process.env.COMPANY_CONTACT}` : '',
  }

  return <InvoicePDF invoice={invoice} companyInfo={companyInfo} />
}

