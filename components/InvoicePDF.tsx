'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/utils'

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
  },
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1pt solid #000',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1pt solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #ccc',
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 16,
    borderTop: '2pt solid #000',
    paddingTop: 5,
    marginTop: 10,
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

const InvoiceDocument = ({ invoice }: { invoice: Invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>請求書</Text>

      <View style={styles.header}>
        <View>
          <Text>発行日: {formatDate(invoice.issueDate)}</Text>
          <Text>支払期限: {formatDate(invoice.dueDate)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>請求先</Text>
        <Text>{invoice.clients.name}</Text>
        {invoice.clients.address && <Text>{invoice.clients.address}</Text>}
        {invoice.clients.email && <Text>{invoice.clients.email}</Text>}
        {invoice.clients.invoiceRegNo && (
          <Text>適格請求書発行事業者番号: {invoice.clients.invoiceRegNo}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>明細</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>明細名</Text>
            <Text style={styles.col2}>数量</Text>
            <Text style={styles.col3}>単価</Text>
            <Text style={styles.col4}>税率</Text>
            <Text style={styles.col5}>金額</Text>
          </View>
          {invoice.invoice_items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{item.unitPriceYen.toLocaleString()}</Text>
              <Text style={styles.col4}>{(item.taxRate * 100).toFixed(0)}%</Text>
              <Text style={styles.col5}>{item.amountYen.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>税抜合計:</Text>
          <Text style={styles.totalAmount}>{invoice.subtotalYen.toLocaleString()}円</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>税額:</Text>
          <Text style={styles.totalAmount}>{invoice.taxYen.toLocaleString()}円</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.totalLabel}>合計:</Text>
          <Text style={styles.totalAmount}>{invoice.totalYen.toLocaleString()}円</Text>
        </View>
      </View>

      {invoice.bankAccount && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>振込先</Text>
          <Text>{invoice.bankAccount}</Text>
        </View>
      )}

      {invoice.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>備考</Text>
          <Text>{invoice.notes}</Text>
        </View>
      )}
    </Page>
  </Document>
)

export default function InvoicePDF({ invoice }: { invoice: Invoice }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white p-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">請求書PDF</h1>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={<InvoiceDocument invoice={invoice} />}
            fileName={`請求書_${invoice.clients.name}_${formatDate(invoice.issueDate)}.pdf`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            PDFをダウンロード
          </PDFDownloadLink>
          <button
            onClick={() => {
              window.location.href = `/api/invoices/${invoice.id}/excel`
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Excelをダウンロード
          </button>
        </div>
      </div>
      <div className="flex-1">
        <PDFViewer width="100%" height="100%">
          <InvoiceDocument invoice={invoice} />
        </PDFViewer>
      </div>
    </div>
  )
}

