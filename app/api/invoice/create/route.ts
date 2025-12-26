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
    const externalApiUrl = process.env.INVOICE_API_URL || 'https://api.invoice-generator.com/v1/invoice'
    
    let response: Response
    let responseData: InvoiceGeneratorResponse

    try {
      response = await fetch(externalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(validatedData),
      })
    } catch (fetchError) {
      console.error('Error fetching invoice API:', fetchError)
      return NextResponse.json(
        {
          success: false,
          message: `Failed to connect to invoice API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        },
        { status: 500 }
      )
    }

    // レスポンスのテキストを取得（JSONパース前にエラー内容を確認）
    const responseText = await response.text()
    
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Error parsing invoice API response:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json(
        {
          success: false,
          message: `Invalid response from invoice API: ${responseText.substring(0, 200)}`,
        },
        { status: 500 }
      )
    }

    // 外部APIのレスポンスに基づいて処理
    if (!response.ok || !responseData.success) {
      console.error('Invoice API error:', {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
      })
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || `Failed to generate invoice PDF (Status: ${response.status})`,
        },
        { status: response.status || 500 }
      )
    }

    // 成功時のレスポンス
    if (!responseData.pdf_url) {
      console.error('Invoice API response missing pdf_url:', responseData)
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice API did not return PDF URL',
        },
        { status: 500 }
      )
    }

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
      console.error('JSON parse error:', error)
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
