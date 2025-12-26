import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// リクエストボディのスキーマ定義
const invoiceItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
})

const invoiceCreateSchema = z.object({
  from: z.string(),
  to: z.string(),
  logo: z.string().url().optional(),
  number: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD形式
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD形式
  currency: z.string().default('JPY'),
  items: z.array(invoiceItemSchema).min(1),
  tax: z.number().min(0).max(1).default(0.1),
  notes: z.string().optional(),
})

// 外部APIのレスポンス型定義
interface InvoiceGeneratorResponse {
  success: boolean
  pdf_url?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    // 環境変数のチェック
    const apiKey = process.env.INVOICE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Invoice API key is not configured' },
        { status: 500 }
      )
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json()
    const validatedData = invoiceCreateSchema.parse(body)

    // 外部APIへのリクエスト
    const externalApiUrl = 'https://api.invoice-generator.com/v1/invoice'
    
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(validatedData),
    })

    const responseData: InvoiceGeneratorResponse = await response.json()

    // 外部APIのレスポンスに基づいて処理
    if (!response.ok || !responseData.success) {
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || 'Failed to generate invoice PDF',
        },
        { status: response.status || 500 }
      )
    }

    // 成功時のレスポンス
    return NextResponse.json({
      success: true,
      pdf_url: responseData.pdf_url,
    })
  } catch (error) {
    // Zodバリデーションエラー
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

    // JSONパースエラー
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    // その他のエラー
    console.error('Error creating invoice PDF:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
