import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 会社情報を環境変数から取得
    const companyInfo = {
      name: process.env.COMPANY_NAME || '株式会社サンプル',
      address: process.env.COMPANY_ADDRESS || '〒123-4567\n東京都新宿区\nサンプルビル',
      phone: process.env.COMPANY_PHONE || '',
      fax: process.env.COMPANY_FAX || '',
      email: process.env.COMPANY_EMAIL || '',
      contact: process.env.COMPANY_CONTACT || '',
    }

    return NextResponse.json(companyInfo)
  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company info' },
      { status: 500 }
    )
  }
}

