'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import dayjs from 'dayjs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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

const STORAGE_KEY_FILTERS = 'dashboard_initial_filters'

export default function DashboardPage() {
  // 初期条件をlocalStorageから読み込む
  const loadInitialFilters = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error loading saved filters:', e)
        }
      }
    }
    // デフォルト値（現在の年月を対象月に設定）
    const now = dayjs()
    return {
      dataA: 'initial_budget',
      dataB: 'actual',
      period: now.format('YYYY'),
      targetMonth: now.format('YYYY/MM'),
      department: 'all',
      allocation: 'none',
    }
  }

  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly')
  const [filterData, setFilterData] = useState(loadInitialFilters)
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [tableData, setTableData] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [chartSettings, setChartSettings] = useState({
    showRevenue: true,
    showOperatingProfit: true,
  })

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        targetMonth: filterData.targetMonth,
        viewMode: viewMode,
        dataA: filterData.dataA,
        dataB: filterData.dataB,
        department: filterData.department,
        allocation: filterData.allocation,
      })
      const res = await fetch(`/api/dashboard/management-report?${params.toString()}`, { cache: 'no-store' })
      
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          setKpiData(result.data.kpi)
          setChartData(result.data.chart)
          setTableData(result.data.table)
        } else {
          console.error('API returned error:', result)
          // フォールバック: 空データを設定
          setKpiData({
            revenue: { value: 0, budget: 0, difference: 0 },
            grossProfit: { value: 0, budget: 0, difference: 0 },
            operatingProfit: { value: 0, budget: 0, difference: 0 },
            netProfit: { value: 0, budget: 0, difference: 0 },
            grossProfitRate: { value: 0, budget: 0, difference: 0 },
            operatingProfitRate: { value: 0, budget: 0, difference: 0 },
          })
          setChartData([])
          setTableData([])
        }
      } else {
        console.error('Failed to fetch dashboard data:', res.status)
        // フォールバック: 空データを設定
        setKpiData({
          revenue: { value: 0, budget: 0, difference: 0 },
          grossProfit: { value: 0, budget: 0, difference: 0 },
          operatingProfit: { value: 0, budget: 0, difference: 0 },
          netProfit: { value: 0, budget: 0, difference: 0 },
          grossProfitRate: { value: 0, budget: 0, difference: 0 },
          operatingProfitRate: { value: 0, budget: 0, difference: 0 },
        })
        setChartData([])
        setTableData([])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // フォールバック: 空データを設定
      setKpiData({
        revenue: { value: 0, budget: 0, difference: 0 },
        grossProfit: { value: 0, budget: 0, difference: 0 },
        operatingProfit: { value: 0, budget: 0, difference: 0 },
        netProfit: { value: 0, budget: 0, difference: 0 },
        grossProfitRate: { value: 0, budget: 0, difference: 0 },
        operatingProfitRate: { value: 0, budget: 0, difference: 0 },
      })
      setChartData([])
      setTableData([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterData, viewMode])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // フィルター変更時に自動更新（対象月と表示モードのみ）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        fetchDashboardData()
      }
    }, 500) // デバウンス: 500ms待機

    return () => clearTimeout(timer)
  }, [filterData.targetMonth, viewMode])

  const handleApplyFilter = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const handleSaveInitialConditions = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filterData))
      alert('初期条件を保存しました')
    }
  }

  // 対象月の選択肢を動的に生成（過去12ヶ月）
  const generateMonthOptions = () => {
    const options = []
    const now = dayjs()
    for (let i = 11; i >= 0; i--) {
      const month = now.subtract(i, 'month')
      options.push({
        value: month.format('YYYY/MM'),
        label: month.format('YYYY年M月'),
      })
    }
    return options
  }

  const monthOptions = generateMonthOptions()

  // グラフデータをエクスポート（CSV）
  const handleExportChart = (format: 'csv' | 'excel') => {
    if (chartData.length === 0) {
      alert('エクスポートするデータがありません')
      return
    }

    if (format === 'csv') {
      const headers = ['月', '売上高（当初予算）', '売上高（実績）', '営業利益（当初予算）', '営業利益（実績）']
      const rows = chartData.map((d) => [
        d.month,
        d.revenueBudget,
        d.revenueActual,
        d.operatingProfitBudget,
        d.operatingProfitActual,
      ])
      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ダッシュボード_${dayjs().format('YYYYMMDD')}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      // Excel形式のエクスポート（簡易版 - CSVとして出力）
      alert('Excel形式のエクスポートは準備中です。現在はCSV形式でエクスポートされます。')
      handleExportChart('csv')
    }
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
      value: kpiData.revenue.value,
      budget: kpiData.revenue.budget,
      difference: kpiData.revenue.difference,
      formatter: formatKPICurrency,
      isPercent: false,
    },
    {
      label: '売上総利益',
      value: kpiData.grossProfit.value,
      budget: kpiData.grossProfit.budget,
      difference: kpiData.grossProfit.difference,
      formatter: formatKPICurrency,
      isPercent: false,
    },
    {
      label: '営業利益',
      value: kpiData.operatingProfit.value,
      budget: kpiData.operatingProfit.budget,
      difference: kpiData.operatingProfit.difference,
      formatter: formatKPICurrency,
      isPercent: false,
    },
    {
      label: '当期純利益',
      value: kpiData.netProfit.value,
      budget: kpiData.netProfit.budget,
      difference: kpiData.netProfit.difference,
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
              {Array.from({ length: 5 }, (_, i) => {
                const year = dayjs().year() - i
                return (
                  <option key={year} value={year.toString()}>
                    {year}年04月期
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">対象月</label>
            <select
              value={filterData.targetMonth}
              onChange={(e) => setFilterData({ ...filterData, targetMonth: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
              <div className="relative group">
                <button className="text-gray-500 hover:text-gray-700 text-sm">📥</button>
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExportChart('csv')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm whitespace-nowrap"
                  >
                    CSVでエクスポート
                  </button>
                  <button
                    onClick={() => handleExportChart('excel')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm whitespace-nowrap"
                  >
                    Excelでエクスポート
                  </button>
                </div>
              </div>
              <div className="relative group">
                <button className="text-gray-500 hover:text-gray-700 text-sm">⚙️</button>
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={chartSettings.showRevenue}
                        onChange={(e) =>
                          setChartSettings({ ...chartSettings, showRevenue: e.target.checked })
                        }
                      />
                      <span>売上高を表示</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={chartSettings.showOperatingProfit}
                        onChange={(e) =>
                          setChartSettings({ ...chartSettings, showOperatingProfit: e.target.checked })
                        }
                      />
                      <span>営業利益を表示</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
                <Legend />
                {chartSettings.showRevenue && (
                  <>
                    <Bar dataKey="revenueBudget" fill={COLORS.budget} name="売上高（当初予算）" />
                    <Bar dataKey="revenueActual" fill={COLORS.actual} name="売上高（実績）" />
                  </>
                )}
                {chartSettings.showOperatingProfit && (
                  <>
                    <Bar dataKey="operatingProfitBudget" fill={COLORS.budget} name="営業利益（当初予算）" />
                    <Bar dataKey="operatingProfitActual" fill={COLORS.actual} name="営業利益（実績）" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-400">
              データがありません
            </div>
          )}
        </div>
      </div>

      {/* 追加のグラフエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 売上高推移（折れ線グラフ） */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-bold mb-4">売上高推移</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
                <Legend />
                <Line type="monotone" dataKey="revenueBudget" stroke={COLORS.budget} strokeWidth={2} name="売上高（当初予算）" />
                <Line type="monotone" dataKey="revenueActual" stroke={COLORS.actual} strokeWidth={2} name="売上高（実績）" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              データがありません
            </div>
          )}
        </div>

        {/* 営業利益推移（折れ線グラフ） */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-bold mb-4">営業利益推移</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
                <Legend />
                <Line type="monotone" dataKey="operatingProfitBudget" stroke={COLORS.budget} strokeWidth={2} name="営業利益（当初予算）" />
                <Line type="monotone" dataKey="operatingProfitActual" stroke={COLORS.actual} strokeWidth={2} name="営業利益（実績）" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              データがありません
            </div>
          )}
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
              {tableData.length > 0 && tableData[0].months.map((_, idx) => {
                const [year, month] = filterData.targetMonth.split('/').map(Number)
                const monthDate = dayjs().year(year).month(month - 1).subtract(2 - idx, 'month')
                return (
                  <th key={idx} colSpan={3} className="px-4 py-2 text-center font-medium border-r">
                    {monthDate.format('YYYY/MM')}
                  </th>
                )
              })}
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
