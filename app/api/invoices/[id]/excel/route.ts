import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import dayjs from 'dayjs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoices.findUnique({
      where: { id },
      include: {
        clients: true,
        invoice_items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: '請求書が見つかりません' }, { status: 404 })
    }

    // 会社情報を環境変数から取得
    const companyName = process.env.COMPANY_NAME || '株式会社○○カンパニー'
    const companyAddress = process.env.COMPANY_ADDRESS || '〒XXX-XXXX\n東京都新宿区西新宿\n西新宿○○カンパニービル'
    const companyPhone = process.env.COMPANY_PHONE || ''
    const companyFax = process.env.COMPANY_FAX || ''
    const companyEmail = process.env.COMPANY_EMAIL || ''
    const companyContact = process.env.COMPANY_CONTACT || ''

    // Excelワークブックを作成
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('請求書')

    // 列幅を設定
    worksheet.columns = [
      { width: 8 },   // A: No.
      { width: 35 },  // B: 項目
      { width: 12 },  // C: 数量
      { width: 18 },  // D: 単価
      { width: 18 },  // E: 金額
    ]

    // スタイル定義
    const titleStyle = {
      font: { size: 20, bold: true },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    }

    const headerStyle = {
      font: { size: 11, bold: true },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFE0E0E0' },
      },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: {
        top: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        left: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    }

    const cellStyle = {
      alignment: { vertical: 'middle' as const },
      border: {
        top: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        left: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    }

    const rightAlignStyle = {
      ...cellStyle,
      alignment: { horizontal: 'right' as const, vertical: 'middle' as const },
    }

    // タイトル
    const titleRow = worksheet.addRow(['御請求書'])
    titleRow.height = 35
    worksheet.mergeCells('A1:E1')
    titleRow.getCell(1).style = titleStyle

    // 請求先情報（左上）- 行2から開始
    let currentRow = 2
    const clientRow1 = worksheet.getRow(currentRow)
    clientRow1.getCell(1).value = `${invoice.clients.name} 御中`
    clientRow1.getCell(1).style = { font: { size: 11, bold: true } }
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    currentRow++

    const clientRow2 = worksheet.getRow(currentRow)
    clientRow2.getCell(1).value = 'ご担当: ○○○○○ 様'
    clientRow2.getCell(1).style = { font: { size: 10 } }
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    currentRow++

    const clientRow3 = worksheet.getRow(currentRow)
    clientRow3.getCell(1).value = '件名: ○○○○○○○○'
    clientRow3.getCell(1).style = { font: { size: 10 } }
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    currentRow++

    const requestRow = worksheet.getRow(currentRow)
    requestRow.getCell(1).value = '下記の通り、御請求申し上げます。'
    requestRow.getCell(1).style = { font: { size: 10 } }
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    currentRow++

    // 請求書番号と日付（右上）- 行2から開始
    let rightRow = 2
    const invoiceNoRow = worksheet.getRow(rightRow)
    invoiceNoRow.getCell(4).value = `請求No ${invoice.id.substring(0, 10)}`
    invoiceNoRow.getCell(4).style = { font: { size: 10 }, alignment: { horizontal: 'right', vertical: 'middle' } }
    worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
    rightRow++

    const invoiceDateRow = worksheet.getRow(rightRow)
    invoiceDateRow.getCell(4).value = `請求日 ${dayjs(invoice.issueDate).format('YYYY年M月D日')}`
    invoiceDateRow.getCell(4).style = { font: { size: 10 }, alignment: { horizontal: 'right', vertical: 'middle' } }
    worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
    rightRow++

    // 発行元情報（右上）
    const companyRow1 = worksheet.getRow(rightRow)
    companyRow1.getCell(4).value = companyName
    companyRow1.getCell(4).style = { font: { size: 11, bold: true }, alignment: { horizontal: 'right', vertical: 'middle' } }
    worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
    rightRow++

    if (companyAddress) {
      const addressLines = companyAddress.split('\n')
      addressLines.forEach((line) => {
        const companyRow = worksheet.getRow(rightRow)
        companyRow.getCell(4).value = line
        companyRow.getCell(4).style = { font: { size: 10 }, alignment: { horizontal: 'right', vertical: 'middle' } }
        worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
        rightRow++
      })
    }

    if (companyPhone) {
      const companyRow = worksheet.getRow(rightRow)
      companyRow.getCell(4).value = `TEL: ${companyPhone}`
      companyRow.getCell(4).style = { font: { size: 9 }, alignment: { horizontal: 'right', vertical: 'middle' } }
      worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
      rightRow++
    }

    if (companyFax) {
      const companyRow = worksheet.getRow(rightRow)
      companyRow.getCell(4).value = `FAX: ${companyFax}`
      companyRow.getCell(4).style = { font: { size: 9 }, alignment: { horizontal: 'right', vertical: 'middle' } }
      worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
      rightRow++
    }

    if (companyEmail) {
      const companyRow = worksheet.getRow(rightRow)
      companyRow.getCell(4).value = `E-Mail: ${companyEmail}`
      companyRow.getCell(4).style = { font: { size: 9 }, alignment: { horizontal: 'right', vertical: 'middle' } }
      worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
      rightRow++
    }

    if (companyContact) {
      const companyRow = worksheet.getRow(rightRow)
      companyRow.getCell(4).value = `担当者: ${companyContact}`
      companyRow.getCell(4).style = { font: { size: 9 }, alignment: { horizontal: 'right', vertical: 'middle' } }
      worksheet.mergeCells(`D${rightRow}:E${rightRow}`)
      rightRow++
    }

    // 支払期限と振込先（左側）
    const paymentRow = Math.max(currentRow, rightRow) + 1
    const dueDateRow = worksheet.getRow(paymentRow)
    dueDateRow.getCell(1).value = `お支払期限: ${dayjs(invoice.dueDate).format('YYYY年M月D日')}`
    dueDateRow.getCell(1).style = { font: { size: 10 } }
    worksheet.mergeCells(`A${paymentRow}:C${paymentRow}`)

    // 合計金額（右側）
    dueDateRow.getCell(4).value = '合計金額:'
    dueDateRow.getCell(4).style = { font: { size: 10 }, alignment: { horizontal: 'right', vertical: 'middle' } }
    dueDateRow.getCell(5).value = `¥${invoice.totalYen.toLocaleString()}`
    dueDateRow.getCell(5).style = { font: { size: 20, bold: true }, alignment: { horizontal: 'right', vertical: 'middle' } }
    dueDateRow.getCell(5).numFmt = '#,##0'

    const taxIncludedRow = worksheet.getRow(paymentRow + 1)
    taxIncludedRow.getCell(5).value = '(税込)'
    taxIncludedRow.getCell(5).style = { font: { size: 9 }, alignment: { horizontal: 'right', vertical: 'middle' } }

    // 振込先情報
    let nextRow = paymentRow + 2
    if (invoice.bankAccount) {
      const bankRow1 = worksheet.getRow(nextRow)
      bankRow1.getCell(1).value = 'お振込先:'
      bankRow1.getCell(1).style = { font: { size: 10 } }
      worksheet.mergeCells(`A${nextRow}:C${nextRow}`)
      nextRow++

      const bankRow2 = worksheet.getRow(nextRow)
      bankRow2.getCell(1).value = invoice.bankAccount
      bankRow2.getCell(1).style = { font: { size: 10 } }
      worksheet.mergeCells(`A${nextRow}:C${nextRow}`)
      nextRow++
    }

    // 空行
    nextRow++

    // 明細テーブルのヘッダー
    const headerRow = worksheet.getRow(nextRow)
    headerRow.values = ['No.', '項目', '数量', '単価', '金額']
    headerRow.height = 25
    headerRow.eachCell((cell, colNumber) => {
      cell.style = headerStyle
      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else if (colNumber >= 3) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }
    })

    // 明細行
    let itemRowNum = nextRow + 1
    invoice.invoice_items.forEach((item, index) => {
      const row = worksheet.getRow(itemRowNum)
      row.values = [
        index + 1,
        item.description,
        item.quantity,
        item.unitPriceYen,
        item.amountYen,
      ]
      
      row.getCell(1).style = { ...cellStyle, alignment: { horizontal: 'center', vertical: 'middle' } }
      row.getCell(2).style = cellStyle
      row.getCell(3).style = rightAlignStyle
      row.getCell(4).style = rightAlignStyle
      row.getCell(5).style = rightAlignStyle
      
      // 数値フォーマット
      row.getCell(4).numFmt = '#,##0'
      row.getCell(5).numFmt = '#,##0'
      itemRowNum++
    })

    // 空行
    itemRowNum++

    // サマリーセクション（右下）
    const subtotalRow = worksheet.getRow(itemRowNum)
    subtotalRow.getCell(4).value = '小計'
    subtotalRow.getCell(4).style = { ...cellStyle, font: { size: 10 } }
    subtotalRow.getCell(5).value = invoice.subtotalYen
    subtotalRow.getCell(5).style = { ...rightAlignStyle, font: { size: 10 } }
    subtotalRow.getCell(5).numFmt = '#,##0'

    itemRowNum++
    const taxRow = worksheet.getRow(itemRowNum)
    taxRow.getCell(4).value = '消費税額'
    taxRow.getCell(4).style = { ...cellStyle, font: { size: 10 } }
    taxRow.getCell(5).value = invoice.taxYen
    taxRow.getCell(5).style = { ...rightAlignStyle, font: { size: 10 } }
    taxRow.getCell(5).numFmt = '#,##0'

    itemRowNum++
    const totalRow = worksheet.getRow(itemRowNum)
    totalRow.getCell(4).value = '合計金額'
    totalRow.getCell(4).style = { ...cellStyle, font: { size: 12, bold: true }, border: {
      top: { style: 'medium' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    } }
    totalRow.getCell(5).value = invoice.totalYen
    totalRow.getCell(5).style = { ...rightAlignStyle, font: { size: 12, bold: true }, border: {
      top: { style: 'medium' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    } }
    totalRow.getCell(5).numFmt = '#,##0'

    // 備考欄（左下）
    if (invoice.notes) {
      const notesStartRow = itemRowNum - 2
      const notesRow = worksheet.getRow(notesStartRow)
      notesRow.getCell(1).value = '備考'
      notesRow.getCell(1).style = { ...cellStyle, font: { size: 10, bold: true }, fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      } }
      worksheet.mergeCells(`A${notesStartRow}:C${notesStartRow}`)
      
      const notesContentRow = worksheet.getRow(notesStartRow + 1)
      notesContentRow.getCell(1).value = invoice.notes
      notesContentRow.getCell(1).style = { ...cellStyle, alignment: { vertical: 'top' } }
      worksheet.mergeCells(`A${notesStartRow + 1}:C${notesStartRow + 3}`)
    }

    // Excelファイルを生成
    const buffer = await workbook.xlsx.writeBuffer()

    // ファイル名を生成
    const fileName = `請求書_${invoice.clients.name}_${dayjs(invoice.issueDate).format('YYYYMMDD')}.xlsx`
    const encodedFileName = encodeURIComponent(fileName)

    // レスポンスを返す
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel:', error)
    return NextResponse.json(
      { error: 'Excelファイルの生成に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
