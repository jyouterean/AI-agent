import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const monthsParam = searchParams.get('months')
    const months = monthsParam ? parseInt(monthsParam) : 6

    const now = dayjs()
    const startDate = now.subtract(months, 'month').startOf('month').toDate()
    const endDate = now.endOf('month').toDate()

    // 今月の売上・支出
    const currentMonthStart = now.startOf('month').toDate()
    const currentMonthEnd = now.endOf('month').toDate()

    const incomeTransactions = await prisma.transactions.findMany({
      where: {
        type: 'income',
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    })

    const expenseTransactions = await prisma.transactions.findMany({
      where: {
        type: 'expense',
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    })

    const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amountYen, 0)
    const expenseTotal = expenseTransactions.reduce((sum, t) => sum + t.amountYen, 0)
    const grossProfit = incomeTotal - expenseTotal

    // 未回収額
    const unpaidInvoices = await prisma.invoices.findMany({
      where: {
        status: 'sent',
      },
    })
    const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.totalYen, 0)

    // 月別の売上・支出データ
    const monthlyData: Array<{ month: string; income: number; expense: number }> = []
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = now.subtract(i, 'month').startOf('month').toDate()
      const monthEnd = now.subtract(i, 'month').endOf('month').toDate()

      const monthIncome = await prisma.transactions.aggregate({
        where: {
          type: 'income',
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amountYen: true,
        },
      })

      const monthExpense = await prisma.transactions.aggregate({
        where: {
          type: 'expense',
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amountYen: true,
        },
      })

      monthlyData.push({
        month: now.subtract(i, 'month').format('YYYY年M月'),
        income: monthIncome._sum.amountYen || 0,
        expense: monthExpense._sum.amountYen || 0,
      })
    }

    // 今月の日別売上・支出データ
    const dailyData: Array<{ date: string; income: number; expense: number }> = []
    for (let i = 0; i < now.date(); i++) {
      const dayStart = now.subtract(i, 'day').startOf('day').toDate()
      const dayEnd = now.subtract(i, 'day').endOf('day').toDate()

      const dayIncome = await prisma.transactions.aggregate({
        where: {
          type: 'income',
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: {
          amountYen: true,
        },
      })

      const dayExpense = await prisma.transactions.aggregate({
        where: {
          type: 'expense',
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: {
          amountYen: true,
        },
      })

      dailyData.unshift({
        date: now.subtract(i, 'day').format('M/D'),
        income: dayIncome._sum.amountYen || 0,
        expense: dayExpense._sum.amountYen || 0,
      })
    }

    // 支出カテゴリ別集計
    const categoryExpenses = await prisma.transactions.groupBy({
      by: ['accountCategory'],
      where: {
        type: 'expense',
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: {
        amountYen: true,
      },
      orderBy: {
        _sum: {
          amountYen: 'desc',
        },
      },
      take: 10,
    })

    const categoryData = categoryExpenses.map((cat) => ({
      name: cat.accountCategory,
      value: cat._sum.amountYen || 0,
    }))

    // 請求書ステータス別集計
    const invoiceStatusCounts = await prisma.invoices.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    const statusData = invoiceStatusCounts.map((status) => ({
      name: status.status === 'draft' ? '下書き' : status.status === 'sent' ? '送付済' : '入金済',
      value: status._count.id,
    }))

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          incomeTotal,
          expenseTotal,
          grossProfit,
          unpaidTotal,
        },
        monthlyData,
        dailyData,
        categoryData,
        statusData,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'ダッシュボードデータの取得に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

