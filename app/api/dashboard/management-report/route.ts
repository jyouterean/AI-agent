import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const targetMonth = searchParams.get('targetMonth') || dayjs().format('YYYY/MM')
    const viewMode = searchParams.get('viewMode') || 'monthly'

    // 対象月を解析
    const [year, month] = targetMonth.split('/').map(Number)
    const targetDate = dayjs().year(year).month(month - 1)

    // 対象月の開始日と終了日
    const monthStart = targetDate.startOf('month').toDate()
    const monthEnd = targetDate.endOf('month').toDate()

    // 期首（4月）からの累計期間
    const fiscalYearStart = dayjs().year(year).month(3).startOf('month').toDate() // 4月
    const fiscalYearEnd = targetDate.endOf('month').toDate()

    // 実績データを取得
    // 売上高 = 取引のincome合計
    const incomeTransactions = await prisma.transactions.findMany({
      where: {
        type: 'income',
        date: viewMode === 'monthly' ? { gte: monthStart, lte: monthEnd } : { gte: fiscalYearStart, lte: fiscalYearEnd },
      },
    })

    const expenseTransactions = await prisma.transactions.findMany({
      where: {
        type: 'expense',
        date: viewMode === 'monthly' ? { gte: monthStart, lte: monthEnd } : { gte: fiscalYearStart, lte: fiscalYearEnd },
      },
    })

    // 売上高（実績）
    const revenueActual = incomeTransactions.reduce((sum, t) => sum + t.amountYen, 0)

    // 売上原価（実績）- 支出のうち原価に該当するもの
    const costOfGoodsSold = expenseTransactions
      .filter((t) => t.accountCategory.includes('原価') || t.accountCategory.includes('仕入'))
      .reduce((sum, t) => sum + t.amountYen, 0)

    // 売上総利益（実績）
    const grossProfitActual = revenueActual - costOfGoodsSold

    // 販管費（実績）
    const sellingExpenses = expenseTransactions
      .filter((t) => !t.accountCategory.includes('原価') && !t.accountCategory.includes('仕入'))
      .reduce((sum, t) => sum + t.amountYen, 0)

    // 営業利益（実績）
    const operatingProfitActual = grossProfitActual - sellingExpenses

    // 当期純利益（実績）- 簡易的に営業利益と同じとする
    const netProfitActual = operatingProfitActual

    // 予算データ（現在は実績の80%を予算として設定 - 後で予算テーブルを追加可能）
    const budgetRatio = 0.8
    const revenueBudget = Math.round(revenueActual * budgetRatio)
    const grossProfitBudget = Math.round(grossProfitActual * budgetRatio)
    const operatingProfitBudget = Math.round(operatingProfitActual * budgetRatio)
    const netProfitBudget = Math.round(netProfitActual * budgetRatio)
    const grossProfitRateActual = revenueActual > 0 ? grossProfitActual / revenueActual : 0
    const grossProfitRateBudget = revenueBudget > 0 ? grossProfitBudget / revenueBudget : 0
    const operatingProfitRateActual = revenueActual > 0 ? operatingProfitActual / revenueActual : 0
    const operatingProfitRateBudget = revenueBudget > 0 ? operatingProfitBudget / revenueBudget : 0

    // KPIデータ
    const kpiData = {
      revenue: {
        value: revenueActual,
        budget: revenueBudget,
        difference: revenueActual - revenueBudget,
      },
      grossProfit: {
        value: grossProfitActual,
        budget: grossProfitBudget,
        difference: grossProfitActual - grossProfitBudget,
      },
      operatingProfit: {
        value: operatingProfitActual,
        budget: operatingProfitBudget,
        difference: operatingProfitActual - operatingProfitBudget,
      },
      netProfit: {
        value: netProfitActual,
        budget: netProfitBudget,
        difference: netProfitActual - netProfitBudget,
      },
      grossProfitRate: {
        value: grossProfitRateActual,
        budget: grossProfitRateBudget,
        difference: grossProfitRateActual - grossProfitRateBudget,
      },
      operatingProfitRate: {
        value: operatingProfitRateActual,
        budget: operatingProfitRateBudget,
        difference: operatingProfitRateActual - operatingProfitRateBudget,
      },
    }

    // グラフデータ（過去3ヶ月）
    const chartData = []
    for (let i = 2; i >= 0; i--) {
      const chartMonth = targetDate.subtract(i, 'month')
      const chartMonthStart = chartMonth.startOf('month').toDate()
      const chartMonthEnd = chartMonth.endOf('month').toDate()

      const monthIncome = await prisma.transactions.aggregate({
        where: {
          type: 'income',
          date: { gte: chartMonthStart, lte: chartMonthEnd },
        },
        _sum: { amountYen: true },
      })

      const monthExpenses = await prisma.transactions.findMany({
        where: {
          type: 'expense',
          date: { gte: chartMonthStart, lte: chartMonthEnd },
        },
      })

      const monthRevenue = monthIncome._sum.amountYen || 0
      const monthCostOfGoodsSold = monthExpenses
        .filter((t) => t.accountCategory.includes('原価') || t.accountCategory.includes('仕入'))
        .reduce((sum, t) => sum + t.amountYen, 0)
      const monthGrossProfit = monthRevenue - monthCostOfGoodsSold
      const monthSellingExpenses = monthExpenses
        .filter((t) => !t.accountCategory.includes('原価') && !t.accountCategory.includes('仕入'))
        .reduce((sum, t) => sum + t.amountYen, 0)
      const monthOperatingProfit = monthGrossProfit - monthSellingExpenses

      chartData.push({
        month: chartMonth.format('YYYY/MM'),
        revenueBudget: Math.round(monthRevenue * budgetRatio),
        revenueActual: monthRevenue,
        operatingProfitBudget: Math.round(monthOperatingProfit * budgetRatio),
        operatingProfitActual: monthOperatingProfit,
      })
    }

    // テーブルデータ（勘定科目別）
    const accountCategories = await prisma.transactions.groupBy({
      by: ['accountCategory'],
      where: {
        date: viewMode === 'monthly' ? { gte: monthStart, lte: monthEnd } : { gte: fiscalYearStart, lte: fiscalYearEnd },
      },
      _sum: { amountYen: true },
    })

    // 月別データを取得（過去3ヶ月）
    const tableRows: Array<{
      accountName: string
      months: Array<{ budget: number; actual: number; difference: number }>
      cumulative: { budget: number; actual: number; difference: number }
    }> = []

    // 主要な勘定科目
    const mainAccounts = ['売上高', '売上原価', '人件費', '営業利益']
    const categoryMap = new Map<string, number>()

    accountCategories.forEach((cat) => {
      categoryMap.set(cat.accountCategory, cat._sum.amountYen || 0)
    })

    // 売上高
    const revenueByMonth = []
    let cumulativeRevenue = 0
    let cumulativeRevenueBudget = 0

    for (let i = 2; i >= 0; i--) {
      const tableMonth = targetDate.subtract(i, 'month')
      const tableMonthStart = tableMonth.startOf('month').toDate()
      const tableMonthEnd = tableMonth.endOf('month').toDate()

      const monthRevenue = await prisma.transactions.aggregate({
        where: {
          type: 'income',
          date: { gte: tableMonthStart, lte: tableMonthEnd },
        },
        _sum: { amountYen: true },
      })

      const actual = monthRevenue._sum.amountYen || 0
      const budget = Math.round(actual * budgetRatio)
      cumulativeRevenue += actual
      cumulativeRevenueBudget += budget

      revenueByMonth.push({ budget, actual, difference: actual - budget })
    }

    tableRows.push({
      accountName: '売上高',
      months: revenueByMonth,
      cumulative: {
        budget: cumulativeRevenueBudget,
        actual: cumulativeRevenue,
        difference: cumulativeRevenue - cumulativeRevenueBudget,
      },
    })

    // その他の主要科目も同様に計算
    const expenseCategories = ['売上原価', '人件費', 'その他経費']
    for (const category of expenseCategories) {
      const months = []
      let cumulativeActual = 0
      let cumulativeBudget = 0

      for (let i = 2; i >= 0; i--) {
        const tableMonth = targetDate.subtract(i, 'month')
        const tableMonthStart = tableMonth.startOf('month').toDate()
        const tableMonthEnd = tableMonth.endOf('month').toDate()

        let whereClause: any = {
          type: 'expense',
          date: { gte: tableMonthStart, lte: tableMonthEnd },
        }
        
        if (category === '売上原価') {
          whereClause.accountCategory = { contains: '原価' }
        } else if (category === '人件費') {
          whereClause.accountCategory = { contains: '人件' }
        } else if (category === 'その他経費') {
          whereClause.AND = [
            { accountCategory: { not: { contains: '原価' } } },
            { accountCategory: { not: { contains: '人件' } } },
          ]
        }

        const transactions = await prisma.transactions.findMany({
          where: whereClause,
        })

        const actual = transactions.reduce((sum, t) => sum + t.amountYen, 0)
        const budget = Math.round(actual * budgetRatio)
        cumulativeActual += actual
        cumulativeBudget += budget

        months.push({ budget, actual, difference: actual - budget })
      }

      if (cumulativeActual > 0 || category === '売上原価') {
        tableRows.push({
          accountName: category,
          months,
          cumulative: {
            budget: cumulativeBudget,
            actual: cumulativeActual,
            difference: cumulativeActual - cumulativeBudget,
          },
        })
      }
    }

    // 営業利益
    const operatingProfitByMonth = []
    let cumulativeOpProfit = 0
    let cumulativeOpProfitBudget = 0

    for (let i = 2; i >= 0; i--) {
      const tableMonth = targetDate.subtract(i, 'month')
      const tableMonthStart = tableMonth.startOf('month').toDate()
      const tableMonthEnd = tableMonth.endOf('month').toDate()

      const monthIncome = await prisma.transactions.aggregate({
        where: {
          type: 'income',
          date: { gte: tableMonthStart, lte: tableMonthEnd },
        },
        _sum: { amountYen: true },
      })

      const monthExpenses = await prisma.transactions.findMany({
        where: {
          type: 'expense',
          date: { gte: tableMonthStart, lte: tableMonthEnd },
        },
      })

      const revenue = monthIncome._sum.amountYen || 0
      const expenses = monthExpenses.reduce((sum, t) => sum + t.amountYen, 0)
      const actual = revenue - expenses
      const budget = Math.round(actual * budgetRatio)
      cumulativeOpProfit += actual
      cumulativeOpProfitBudget += budget

      operatingProfitByMonth.push({ budget, actual, difference: actual - budget })
    }

    tableRows.push({
      accountName: '営業利益',
      months: operatingProfitByMonth,
      cumulative: {
        budget: cumulativeOpProfitBudget,
        actual: cumulativeOpProfit,
        difference: cumulativeOpProfit - cumulativeOpProfitBudget,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        kpi: kpiData,
        chart: chartData,
        table: tableRows,
      },
    })
  } catch (error) {
    console.error('Error fetching management report:', error)
    return NextResponse.json(
      {
        success: false,
        error: '経営レポートデータの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

