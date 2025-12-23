import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import dayjs from 'dayjs'
import Link from 'next/link'

export default async function DashboardPage() {
  const now = dayjs()
  const startOfMonth = now.startOf('month').toDate()
  const endOfMonth = now.endOf('month').toDate()

  // 今月の売上
  const incomeTransactions = await prisma.transaction.findMany({
    where: {
      type: 'income',
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  })
  const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amountYen, 0)

  // 今月の支出
  const expenseTransactions = await prisma.transaction.findMany({
    where: {
      type: 'expense',
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  })
  const expenseTotal = expenseTransactions.reduce((sum, t) => sum + t.amountYen, 0)

  // 未回収額（送付済みだが未入金の請求書）
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: 'sent',
    },
  })
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.totalYen, 0)

  const grossProfit = incomeTotal - expenseTotal

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-sm font-medium text-gray-600 mb-2">今月の売上</h2>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(incomeTotal)}</p>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-sm font-medium text-gray-600 mb-2">今月の支出</h2>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(expenseTotal)}</p>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h2 className="text-sm font-medium text-gray-600 mb-2">粗利</h2>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(grossProfit)}</p>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-sm font-medium text-gray-600 mb-2">未回収額</h2>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(unpaidTotal)}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">クイックアクション</h2>
        <div className="flex gap-4">
          <Link href="/transactions/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            取引を登録
          </Link>
          <Link href="/invoices/new" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            請求書を作成
          </Link>
          <Link href="/agent" className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
            AIエージェントに相談
          </Link>
        </div>
      </div>
    </div>
  )
}

