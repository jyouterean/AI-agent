import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { z } from 'zod'
import React from 'react'
import InvoiceDocument from '@/components/InvoicePDFDocument'

const invoiceGenerateSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  clientAddress: z.string().optional(),
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit_cost: z.number(),
      tax_rate: z.number(),
    })
  ),
  notes: z.string().optional(),
  logoUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = invoiceGenerateSchema.parse(body)

    // 会社情報を環境変数から取得
    const companyInfo = {
      name: process.env.COMPANY_NAME || '株式会社サンプル',
      address: process.env.COMPANY_ADDRESS || '〒123-4567\n東京都新宿区\nサンプルビル',
      phone: process.env.COMPANY_PHONE || '',
      fax: process.env.COMPANY_FAX || '',
      email: process.env.COMPANY_EMAIL || '',
      contact: process.env.COMPANY_CONTACT || '',
    }

    // 合計金額を計算
    let subtotal = 0
    let tax = 0
    const invoiceItems = validatedData.items.map((item) => {
      const itemSubtotal = item.quantity * item.unit_cost
      const itemTax = Math.floor(itemSubtotal * item.tax_rate)
      subtotal += itemSubtotal
      tax += itemTax
      return {
        id: Date.now().toString() + Math.random(),
        description: item.name,
        quantity: item.quantity,
        unitPriceYen: item.unit_cost,
        amountYen: itemSubtotal,
        taxRate: item.tax_rate,
      }
    })

    const total = subtotal + tax

    // 請求書データを構築
    const invoiceData = {
      id: validatedData.invoiceNumber,
      clientId: validatedData.clientId,
      issueDate: new Date(validatedData.issueDate),
      dueDate: new Date(validatedData.dueDate),
      status: 'draft',
      subtotalYen: subtotal,
      taxYen: tax,
      totalYen: total,
      notes: validatedData.notes || null,
      bankAccount: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      clients: {
        id: validatedData.clientId,
        name: validatedData.clientName,
        address: validatedData.clientAddress || null,
        email: null,
        invoiceRegNo: null,
      },
      invoice_items: invoiceItems,
    }

    // PDFを生成
    const pdfElement = React.createElement(InvoiceDocument, { invoice: invoiceData, companyInfo: companyInfo })
    const pdfBuffer = await renderToBuffer(pdfElement as any)

    // PDFをBase64エンコードして返す（またはBlob URLとして返す）
    const base64Pdf = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`

    return NextResponse.json({
      success: true,
      pdf_data_url: dataUrl,
    })
  } catch (error) {
    console.error('Error generating PDF:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      },
      { status: 500 }
    )
  }
}

