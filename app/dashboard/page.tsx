'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface KPIData {
  revenue: { value: number; budget: number; difference: number }
  grossProfit: { value: number; budget: number; difference: number }
  operatingProfit: { value: number; budget: number; difference: number }
  netProfit: { value: number; budget: number; difference: number }
  grossProfitRate: { value: number; budget: number; difference: number }
  operatingProfitRate: { value: number; budget: number; difference: number }
}

interface ChartData {
  month: string
  revenueBudget: number
  revenueActual: number
  operatingProfitBudget: number
  operatingProfitActual: number
}

interface TableRow {
  accountName: string
  months: {
    budget: number
    actual: number
    difference: number
  }[]
  cumulative: {
    budget: number
    actual: number
    difference: number
  }
}

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  budget: '#3b82f6',
  actual: '#8b5cf6',
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly')
  const [filterData, setFilterData] = useState({
    dataA: 'initial_budget',
    dataB: 'actual',
    period: '2024',
    targetMonth: '2024/04',
    department: 'all',
    allocation: 'none',
  })
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [tableData, setTableData] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: 実際のAPIエンドポイントに置き換える
      // const res = await fetch(`/api/dashboard/management-report?${new URLSearchParams(filterData)}`)
      // const data = await res.json()
      
      // モックデータ
      const mockKpiData: KPIData = {
        revenue: { value: 15000000, budget: 12000000, difference: 3000000 },
        grossProfit: { value: 10500000, budget: 8400000, difference: 2100000 },
        operatingProfit: { value: 4500000, budget: 3600000, difference: 900000 },
        netProfit: { value: 3150000, budget: 2520000, difference: 630000 },
        grossProfitRate: { value: 0.7, budget: 0.7, difference: 0 },
        operatingProfitRate: { value: 0.3, budget: 0.3, difference: 0 },
      }

      const mockChartData: ChartData[] = [
        { month: '2024/04', revenueBudget: 12000000, revenueActual: 15000000, operatingProfitBudget: 3600000, operatingProfitActual: 4500000 },
        { month: '2024/05', revenueBudget: 13000000, revenueActual: 16000000, operatingProfitBudget: 3900000, operatingProfitActual: 4800000 },
        { month: '2024/06', revenueBudget: 14000000, revenueActual: 17000000, operatingProfitBudget: 4200000, operatingProfitActual: 5100000 },
      ]

      const mockTableData: TableRow[] = [
        {
          accountName: '売上高',
          months: [
            { budget: 12000000, actual: 15000000, difference: 3000000 },
            { budget: 13000000, actual: 16000000, difference: 3000000 },
            { budget: 14000000, actual: 17000000, difference: 3000000 },
          ],
          cumulative: { budget: 39000000, actual: 48000000, difference: 9000000 },
        },
        {
          accountName: '店舗売上高',
          months: [
            { budget: 10000000, actual: 12000000, difference: 2000000 },
            { budget: 11000000, actual: 13000000, difference: 2000000 },
            { budget: 12000000, actual: 14000000, difference: 2000000 },
          ],
          cumulative: { budget: 33000000, actual: 39000000, difference: 6000000 },
        },
        {
          accountName: '売上原価',
          months: [
            { budget: 3600000, actual: 4500000, difference: -900000 },
            { budget: 3900000, actual: 4800000, difference: -900000 },
            { budget: 4200000, actual: 5100000, difference: -900000 },
          ],
          cumulative: { budget: 11700000, actual: 14400000, difference: -2700000 },
        },
        {
          accountName: '人件費',
          months: [
            { budget: 2000000, actual: 2200000, difference: -200000 },
            { budget: 2100000, actual: 2300000, difference: -200000 },
            { budget: 2200000, actual: 2400000, difference: -200000 },
          ],
          cumulative: { budget: 6300000, actual: 6900000, difference: -600000 },
        },
        {
          accountName: '営業利益',
          months: [
            { budget: 3600000, actual: 4500000, difference: 900000 },
            { budget: 3900000, actual: 4800000, difference: 900000 },
            { budget: 4200000, actual: 5100000, difference: 900000 },
          ],
          cumulative: { budget: 11700000, actual: 14400000, difference: 2700000 },
        },
      ]

      setKpiData(mockKpiData)
      setChartData(mockChartData)
      setTableData(mockTableData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterData])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleApplyFilter = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const handleSaveInitialConditions = () => {
    // TODO: 初期条件の保存機能を実装
    alert('初期条件を保存しました')
  }

  const formatKPICurrency = (value: number) => {
    if (Math.abs(value) >= 100000000) {
      return `${(value / 100000000).toFixed(1)}億円`
    } else if (Math.abs(value) >= 10000) {
      return `${(value / 10000).toFixed(0)}万円`
    }
    return `${value.toLocaleString()}円`
  }

  const formatKPIPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatTableValue = (value: number) => {
    if (Math.abs(value) >= 100000000) {
      return `${(value / 100000000).toFixed(2)}億`
    } else if (Math.abs(value) >= 10000) {
      return `${(value / 10000).toFixed(0)}万`
    }
    return value.toLocaleString()
  }

  if (loading && !kpiData) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  if (!kpiData) {
    return <div className="p-8 text-center text-gray-500">データの取得に失敗しました</div>
  }

  const kpiCards = [
    {
      label: '売上高',
      value: viewMode === 'monthly' ? kpiData.revenue.value : kpiData.revenue.value * 3,
      budget: viewMode === 'monthly' ? kpiData.revenue.budget : kpiData.revenue.budget * 3,
      difference: viewMode === 'monthly' ? kpiData.revenue.difference : kpiData.revenue.difference * 3,
      formatter: formatKPICurrency,
      isPercent: false,
    },
    {
      label: '売上総利益',
      value: viewMode === 'monthly' ? kpiData.grossProfit.value : kpiData.grossProfit.value * 3,
      budget: viewMode === 'monthly' ? kpiData.grossProfit.budget : kpiData.grossProfit.budget * 3,
      difference: viewMode === 'monthly' ? kpiData.grossProfit.difference : kpiData.grossProfit.difference * 3,
      formatter: formatKPICurrency,
      isPercent: false,
    },
    {
      label: '営業利益',
      value: viewMode === 'monthly' ? kpiData.operatingProfit.value : kpiData.operatingProfit.value * 3,
      budget: viewMode === 'monthly' ? kpiData.operatingProfit.budget : kpiData.operatingProfit.budget * 3,
      difference: viewMode === 'monthly' ? kpiData.operatingProfit.difference : kpiData.operatingProfit.difference * 3,
      formatter: formatKPICurrency,
      isPercent: false,
    },
    {
      label: '当期純利益',
      value: viewMode === 'monthly' ? kpiData.netProfit.value : kpiData.netProfit.value * 3,
      budget: viewMode === 'monthly' ? kpiData.netProfit.budget : kpiData.netProfit.budget * 3,
      difference: viewMode === 'monthly' ? kpiData.netProfit.difference : kpiData.netProfit.difference * 3,
      formatter: formatKPICurrency,
      isPercent: false,
    },
    {
      label: '売上総利益率',
      value: kpiData.grossProfitRate.value,
      budget: kpiData.grossProfitRate.budget,
      difference: kpiData.grossProfitRate.difference,
      formatter: formatKPIPercent,
      isPercent: true,
    },
    {
      label: '営業利益率',
      value: kpiData.operatingProfitRate.value,
      budget: kpiData.operatingProfitRate.budget,
      difference: kpiData.operatingProfitRate.difference,
      formatter: formatKPIPercent,
      isPercent: true,
    },
  ]

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* タイトルと表示モード切替 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">経営レポート／実績分析</h1>
        <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded ${
              viewMode === 'monthly' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            対象月
          </button>
          <button
            onClick={() => setViewMode('cumulative')}
            className={`px-4 py-2 rounded ${
              viewMode === 'cumulative' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            累計
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">表示データ（A）</label>
            <select
              value={filterData.dataA}
              onChange={(e) => setFilterData({ ...filterData, dataA: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="initial_budget">当初予算</option>
              <option value="revised_budget">修正予算</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">表示データ（B）</label>
            <select
              value={filterData.dataB}
              onChange={(e) => setFilterData({ ...filterData, dataB: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="actual">実績</option>
              <option value="forecast">予測</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">集計期間</label>
            <select
              value={filterData.period}
              onChange={(e) => setFilterData({ ...filterData, period: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="2024">2024年04月期</option>
              <option value="2023">2023年04月期</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">対象月</label>
            <select
              value={filterData.targetMonth}
              onChange={(e) => setFilterData({ ...filterData, targetMonth: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="2024/04">2024/04</option>
              <option value="2024/05">2024/05</option>
              <option value="2024/06">2024/06</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">部門</label>
            <select
              value={filterData.department}
              onChange={(e) => setFilterData({ ...filterData, department: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="all">すべて</option>
              <option value="dept1">部門1</option>
              <option value="dept2">部門2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">配賦</label>
            <select
              value={filterData.allocation}
              onChange={(e) => setFilterData({ ...filterData, allocation: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="none">なし</option>
              <option value="rule1">配賦ルール1</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilter}
              disabled={refreshing}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm disabled:opacity-50"
            >
              条件の適用
            </button>
            <button
              onClick={handleSaveInitialConditions}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
            >
              初期条件の保存
            </button>
          </div>
        </div>
      </div>

      {/* KPIカードとグラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPIカード領域（左側：2列×3段） */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {kpiCards.map((kpi, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-600 mb-2">{kpi.label}</div>
              <div className="text-2xl font-bold mb-2">{kpi.formatter(kpi.value)}</div>
              <div className="text-xs text-gray-500 mb-2">{viewMode === 'monthly' ? '対象月' : '累計'}</div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  予算: {kpi.formatter(kpi.budget)}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    kpi.difference >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {kpi.difference >= 0 ? '+' : ''}
                  {kpi.isPercent ? formatKPIPercent(kpi.difference) : formatKPICurrency(kpi.difference)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* グラフ領域（右側） */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">予算 vs 実績</h2>
            <div className="flex gap-2">
              <button className="text-gray-500 hover:text-gray-700 text-sm">📥</button>
              <button className="text-gray-500 hover:text-gray-700 text-sm">⚙️</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} />
              <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
              <Legend />
              <Bar dataKey="revenueBudget" fill={COLORS.budget} name="売上高（当初予算）" />
              <Bar dataKey="revenueActual" fill={COLORS.actual} name="売上高（実績）" />
              <Bar dataKey="operatingProfitBudget" fill={COLORS.budget} name="営業利益（当初予算）" />
              <Bar dataKey="operatingProfitActual" fill={COLORS.actual} name="営業利益（実績）" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 明細テーブル */}
      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">明細</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-2 text-left font-medium border-r">勘定科目</th>
              {['2024/04', '2024/05', '2024/06'].map((month, idx) => (
                <th key={idx} colSpan={3} className="px-4 py-2 text-center font-medium border-r">
                  {month}
                </th>
              ))}
              <th colSpan={3} className="px-4 py-2 text-center font-medium">
                期首からの累計
              </th>
            </tr>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-2 border-r"></th>
              {[...Array(3)].map((_, idx) => (
                <th key={idx} className="px-4 py-2 text-center font-medium border-r">当初予算</th>
              ))}
              {[...Array(3)].map((_, idx) => (
                <th key={idx} className="px-4 py-2 text-center font-medium border-r">実績</th>
              ))}
              {[...Array(3)].map((_, idx) => (
                <th key={idx} className="px-4 py-2 text-center font-medium border-r">差額</th>
              ))}
              <th className="px-4 py-2 text-center font-medium border-r">当初予算</th>
              <th className="px-4 py-2 text-center font-medium border-r">実績</th>
              <th className="px-4 py-2 text-center font-medium">差額</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium border-r">{row.accountName}</td>
                {row.months.map((month, monthIdx) => (
                  <React.Fragment key={monthIdx}>
                    <td className="px-4 py-2 text-right border-r">
                      {formatTableValue(month.budget)}
                    </td>
                    <td className="px-4 py-2 text-right border-r">
                      {formatTableValue(month.actual)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right border-r ${
                        month.difference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {month.difference >= 0 ? '+' : ''}
                      {formatTableValue(month.difference)}
                    </td>
                  </React.Fragment>
                ))}
                <td className="px-4 py-2 text-right border-r">
                  {formatTableValue(row.cumulative.budget)}
                </td>
                <td className="px-4 py-2 text-right border-r">
                  {formatTableValue(row.cumulative.actual)}
                </td>
                <td
                  className={`px-4 py-2 text-right ${
                    row.cumulative.difference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {row.cumulative.difference >= 0 ? '+' : ''}
                  {formatTableValue(row.cumulative.difference)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
