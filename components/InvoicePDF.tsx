'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/utils'
import dayjs from 'dayjs'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  leftSection: {
    width: '50%',
    paddingRight: 20,
  },
  rightSection: {
    width: '50%',
    paddingLeft: 20,
  },
  recipientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recipientInfo: {
    fontSize: 10,
    marginBottom: 2,
  },
  subjectLine: {
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  requestText: {
    fontSize: 10,
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'right',
  },
  invoiceDate: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'right',
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  companyAddress: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'right',
  },
  companyContact: {
    fontSize: 9,
    marginBottom: 2,
    textAlign: 'right',
  },
  paymentSection: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 15,
  },
  paymentLeft: {
    width: '50%',
    paddingRight: 20,
  },
  paymentRight: {
    width: '50%',
    paddingLeft: 20,
    alignItems: 'flex-end',
  },
  paymentDeadline: {
    fontSize: 10,
    marginBottom: 4,
  },
  bankInfo: {
    fontSize: 10,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1pt solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #ccc',
  },
  colNo: { width: '8%', textAlign: 'center' },
  colItem: { width: '40%' },
  colQuantity: { width: '12%', textAlign: 'right' },
  colUnitPrice: { width: '20%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  summarySection: {
    flexDirection: 'row',
    marginTop: 20,
  },
  summaryLeft: {
    width: '50%',
    paddingRight: 20,
  },
  summaryRight: {
    width: '50%',
    paddingLeft: 20,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
  },
  summaryAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 5,
    paddingTop: 5,
    borderTop: '1pt solid #000',
  },
  totalLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalAmountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 20,
    width: '50%',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#E0E0E0',
    padding: 8,
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 10,
    padding: 8,
    border: '1pt solid #ccc',
    minHeight: 60,
  },
})

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPriceYen: number
  amountYen: number
  taxRate: number
}

interface Client {
  id: string
  name: string
  email: string | null
  address: string | null
  invoiceRegNo: string | null
}

interface Invoice {
  id: string
  clients: Client
  issueDate: Date
  dueDate: Date
  status: string
  subtotalYen: number
  taxYen: number
  totalYen: number
  notes: string | null
  bankAccount: string | null
  invoice_items: InvoiceItem[]
}

interface CompanyInfo {
  name: string
  address: string
  phone: string
  fax: string
  email: string
  contact: string
}

const InvoiceDocument = ({ invoice, companyInfo }: { invoice: Invoice; companyInfo: CompanyInfo }) => {

  const issueDate = dayjs(invoice.issueDate)
  const dueDate = dayjs(invoice.dueDate)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* タイトル */}
        <Text style={styles.title}>御請求書</Text>

        {/* ヘッダーセクション */}
        <View style={styles.headerContainer}>
          {/* 左側：受取人情報 */}
          <View style={styles.leftSection}>
            <Text style={styles.recipientName}>{invoice.clients.name} 御中</Text>
            <Text style={styles.recipientInfo}>ご担当: ○○○○○ 様</Text>
            <Text style={styles.recipientInfo}>件名: ○○○○○○○○</Text>
            <Text style={styles.requestText}>下記の通り、御請求申し上げます。</Text>
          </View>

          {/* 右側：請求番号、日付、送信者情報 */}
          <View style={styles.rightSection}>
            <Text style={styles.invoiceNumber}>請求No {invoice.id.substring(0, 10)}</Text>
            <Text style={styles.invoiceDate}>請求日 {issueDate.format('YYYY年M月D日')}</Text>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            {companyInfo.address.split('\n').map((line, index) => (
              <Text key={index} style={styles.companyAddress}>{line}</Text>
            ))}
            {companyInfo.phone && <Text style={styles.companyContact}>{companyInfo.phone}</Text>}
            {companyInfo.fax && <Text style={styles.companyContact}>{companyInfo.fax}</Text>}
            {companyInfo.email && <Text style={styles.companyContact}>{companyInfo.email}</Text>}
            {companyInfo.contact && <Text style={styles.companyContact}>{companyInfo.contact}</Text>}
          </View>
        </View>

        {/* 支払情報セクション */}
        <View style={styles.paymentSection}>
          {/* 左側：支払期限、振込先 */}
          <View style={styles.paymentLeft}>
            <Text style={styles.paymentDeadline}>お支払期限: {dueDate.format('YYYY年M月D日')}</Text>
            {invoice.bankAccount && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.bankInfo}>お振込先:</Text>
                <Text style={styles.bankInfo}>{invoice.bankAccount}</Text>
              </View>
            )}
          </View>

          {/* 右側：合計金額 */}
          <View style={styles.paymentRight}>
            <Text style={styles.totalLabel}>合計金額:</Text>
            <Text style={styles.totalAmount}>¥{invoice.totalYen.toLocaleString()}</Text>
            <Text style={styles.totalLabel}>(税込)</Text>
          </View>
        </View>

        {/* 明細テーブル */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No.</Text>
            <Text style={styles.colItem}>項目</Text>
            <Text style={styles.colQuantity}>数量</Text>
            <Text style={styles.colUnitPrice}>単価</Text>
            <Text style={styles.colAmount}>金額</Text>
          </View>
          {invoice.invoice_items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colItem}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>{item.unitPriceYen.toLocaleString()}</Text>
              <Text style={styles.colAmount}>{item.amountYen.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* サマリーセクション */}
        <View style={styles.summarySection}>
          {/* 左側：備考 */}
          {invoice.notes && (
            <View style={styles.summaryLeft}>
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>備考</Text>
                <View style={styles.notesContent}>
                  <Text>{invoice.notes}</Text>
                </View>
              </View>
            </View>
          )}

          {/* 右側：小計、消費税額、合計金額 */}
          <View style={styles.summaryRight}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>小計</Text>
              <Text style={styles.summaryAmount}>¥{invoice.subtotalYen.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>消費税額</Text>
              <Text style={styles.summaryAmount}>¥{invoice.taxYen.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelText}>合計金額</Text>
              <Text style={styles.totalAmountText}>¥{invoice.totalYen.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default function InvoicePDF({ invoice, companyInfo }: { invoice: Invoice; companyInfo: CompanyInfo }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white p-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">請求書PDF</h1>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={<InvoiceDocument invoice={invoice} companyInfo={companyInfo} />}
            fileName={`請求書_${invoice.clients.name}_${formatDate(invoice.issueDate)}.pdf`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            PDFをダウンロード
          </PDFDownloadLink>
          <a
            href={`/api/invoices/${invoice.id}/excel`}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Excelをダウンロード
          </a>
        </div>
      </div>
      <div className="flex-1">
        <PDFViewer width="100%" height="100%">
          <InvoiceDocument invoice={invoice} companyInfo={companyInfo} />
        </PDFViewer>
      </div>
    </div>
  )
}
