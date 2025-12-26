'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

interface DashboardData {
  summary: {
    incomeTotal: number
    expenseTotal: number
    grossProfit: number
    unpaidTotal: number
  }
  monthlyData: Array<{ month: string; income: number; expense: number }>
  dailyData: Array<{ date: string; income: number; expense: number }>
  categoryData: Array<{ name: string; value: number }>
  statusData: Array<{ name: string; value: number }>
}

interface CachedData {
  data: DashboardData
  timestamp: number
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
const CACHE_KEY = 'dashboard_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5分

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // キャッシュからデータを取得
  const getCachedData = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed: CachedData = JSON.parse(cached)
        const now = Date.now()
        // キャッシュが有効期限内かチェック
        if (now - parsed.timestamp < CACHE_DURATION) {
          return parsed
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error)
    }
    return null
  }, [])

  // データをキャッシュに保存
  const setCachedData = useCallback((dashboardData: DashboardData) => {
    try {
      const cached: CachedData = {
        data: dashboardData,
        timestamp: Date.now(),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
    } catch (error) {
      console.error('Error saving cache:', error)
    }
  }, [])

  // ダッシュボードデータを取得
  const fetchDashboardData = useCallback(async (useCache: boolean = true) => {
    // キャッシュがあれば先に表示
    if (useCache) {
      const cached = getCachedData()
      if (cached) {
        setData(cached.data)
        setLoading(false)
        // バックグラウンドで最新データを取得して更新
        setRefreshing(true)
        try {
          const res = await fetch('/api/dashboard/stats?months=6')
          if (res.ok) {
            const result = await res.json()
            const dashboardData = result.data
            setData(dashboardData)
            setCachedData(dashboardData)
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error)
        } finally {
          setRefreshing(false)
        }
        return
      }
    }

    try {
      if (!useCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const res = await fetch('/api/dashboard/stats?months=6')
      if (res.ok) {
        const result = await res.json()
        const dashboardData = result.data
        setData(dashboardData)
        setCachedData(dashboardData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // エラー時はキャッシュがあれば使用
      const cached = getCachedData()
      if (cached) {
        setData(cached.data)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getCachedData, setCachedData])

  useEffect(() => {
    fetchDashboardData(true)
  }, [fetchDashboardData])

  // ページがフォーカスされたときにデータを更新（オプション）
  useEffect(() => {
    const handleFocus = () => {
      // キャッシュが古い場合は更新
      const cached = getCachedData()
      if (!cached || Date.now() - cached.timestamp > CACHE_DURATION) {
        fetchDashboardData(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [getCachedData, fetchDashboardData])

  if (loading && !data) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>データの取得に失敗しました</p>
        <button
          onClick={() => fetchDashboardData(false)}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    )
  }

  const { summary, monthlyData, dailyData, categoryData, statusData } = data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm disabled:opacity-50"
          >
            {refreshing ? '更新中...' : '更新'}
          </button>
          <Link
            href="/transactions/new"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
          >
            取引を登録
          </Link>
          <Link
            href="/invoices/new"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
          >
            請求書を作成
          </Link>
        </div>
      </div>

      {refreshing && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded">
          データを更新しています...
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h2 className="text-sm font-medium text-gray-600 mb-2">今月の売上</h2>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.incomeTotal)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h2 className="text-sm font-medium text-gray-600 mb-2">今月の支出</h2>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.expenseTotal)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h2 className="text-sm font-medium text-gray-600 mb-2">粗利</h2>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.grossProfit)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h2 className="text-sm font-medium text-gray-600 mb-2">未回収額</h2>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.unpaidTotal)}</p>
        </div>
      </div>

      {/* 月別推移グラフ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">月別売上・支出推移</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value: number) => `${(value / 10000).toFixed(0)}万円`} />
            <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} name="売上" />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="支出" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 日別推移グラフ */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">今月の日別推移</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value: number) => `${(value / 10000).toFixed(0)}万円`} />
              <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
              <Legend />
              <Bar dataKey="income" fill="#3b82f6" name="売上" />
              <Bar dataKey="expense" fill="#ef4444" name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 支出カテゴリ別円グラフ */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">今月の支出カテゴリ</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              データがありません
            </div>
          )}
        </div>
      </div>

      {/* 請求書ステータス別 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">請求書ステータス</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8b5cf6" name="件数" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* クイックアクション */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/transactions"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            取引一覧
          </Link>
          <Link
            href="/invoices"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            請求書一覧
          </Link>
          <Link
            href="/clients"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            顧客一覧
          </Link>
          <Link
            href="/tasks"
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            タスク一覧
          </Link>
          <Link
            href="/agent"
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            エージェント
          </Link>
        </div>
      </div>
    </div>
  )
}
