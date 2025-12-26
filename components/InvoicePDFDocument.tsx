import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/utils'
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
  requestText: {
    fontSize: 10,
    marginBottom: 8,
  },
  invoiceMeta: {
    fontSize: 10,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 10,
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 10,
    marginBottom: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  paymentInfo: {
    width: '60%',
  },
  paymentDeadline: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bankAccountSection: {
    marginTop: 8,
  },
  bankAccountTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bankAccountText: {
    fontSize: 10,
    marginBottom: 2,
  },
  totalAmountBox: {
    width: '35%',
    border: '1pt solid #000',
    padding: 10,
    alignItems: 'center',
  },
  totalAmountLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  totalAmountValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  taxIncluded: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ccc',
    paddingVertical: 4,
  },
  tableColNo: {
    width: '8%',
    fontSize: 10,
  },
  tableColItem: {
    width: '40%',
    fontSize: 10,
  },
  tableColQty: {
    width: '12%',
    fontSize: 10,
    textAlign: 'right',
  },
  tableColUnitPrice: {
    width: '18%',
    fontSize: 10,
    textAlign: 'right',
  },
  tableColAmount: {
    width: '22%',
    fontSize: 10,
    textAlign: 'right',
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  notesSection: {
    width: '60%',
    paddingRight: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 10,
  },
  totalSummary: {
    width: '40%',
  },
  totalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalSummaryLabel: {
    fontSize: 10,
  },
  totalSummaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalSummaryRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1pt solid #000',
  },
  totalSummaryLabelGrand: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalSummaryValueGrand: {
    fontSize: 12,
    fontWeight: 'bold',
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
  address: string | null
}

interface Invoice {
  id: string
  issueDate: Date
  dueDate: Date
  subtotalYen: number
  taxYen: number
  totalYen: number
  notes: string | null
  bankAccount: string | null
  clients: Client
  invoice_items: InvoiceItem[]
}

interface CompanyInfo {
  name: string
  address: string
  phone?: string
  fax?: string
  email?: string
  contact?: string
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
            {invoice.clients.address && (
              <Text style={styles.recipientInfo}>{invoice.clients.address}</Text>
            )}
            <Text style={styles.requestText}>下記の通り、御請求申し上げます。</Text>
          </View>

          {/* 右側：請求番号、日付、送信者情報 */}
          <View style={styles.rightSection}>
            <Text style={styles.invoiceMeta}>請求No {invoice.id.substring(0, 10)}</Text>
            <Text style={styles.invoiceMeta}>請求日 {issueDate.format('YYYY年M月D日')}</Text>
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

        {/* 合計金額と支払期限 */}
        <View style={styles.summaryContainer}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentDeadline}>お支払期限: {dueDate.format('YYYY年M月D日')}</Text>
            {invoice.bankAccount && (
              <View style={styles.bankAccountSection}>
                <Text style={styles.bankAccountTitle}>お振込先:</Text>
                {invoice.bankAccount.split('\n').map((line, index) => (
                  <Text key={index} style={styles.bankAccountText}>{line}</Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.totalAmountBox}>
            <Text style={styles.totalAmountLabel}>合計金額:</Text>
            <Text style={styles.totalAmountValue}>
              {formatCurrency(invoice.totalYen)}
              <Text style={styles.taxIncluded}>(税込)</Text>
            </Text>
          </View>
        </View>

        {/* 明細テーブル */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableColNo}>No.</Text>
            <Text style={styles.tableColItem}>項目</Text>
            <Text style={styles.tableColQty}>数量</Text>
            <Text style={styles.tableColUnitPrice}>単価</Text>
            <Text style={styles.tableColAmount}>金額</Text>
          </View>
          {invoice.invoice_items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableColNo}>{index + 1}</Text>
              <Text style={styles.tableColItem}>{item.description}</Text>
              <Text style={styles.tableColQty}>{item.quantity}</Text>
              <Text style={styles.tableColUnitPrice}>{item.unitPriceYen.toLocaleString()}</Text>
              <Text style={styles.tableColAmount}>{item.amountYen.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* 合計サマリーと備考 */}
        <View style={styles.footerContainer}>
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>備考</Text>
            <Text style={styles.notesContent}>{invoice.notes || ''}</Text>
          </View>
          <View style={styles.totalSummary}>
            <View style={styles.totalSummaryRow}>
              <Text style={styles.totalSummaryLabel}>小計</Text>
              <Text style={styles.totalSummaryValue}>{formatCurrency(invoice.subtotalYen)}</Text>
            </View>
            <View style={styles.totalSummaryRow}>
              <Text style={styles.totalSummaryLabel}>消費税額</Text>
              <Text style={styles.totalSummaryValue}>{formatCurrency(invoice.taxYen)}</Text>
            </View>
            <View style={styles.totalSummaryRowGrand}>
              <Text style={styles.totalSummaryLabelGrand}>合計金額</Text>
              <Text style={styles.totalSummaryValueGrand}>{formatCurrency(invoice.totalYen)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default InvoiceDocument

