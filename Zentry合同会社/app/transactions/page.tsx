'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import dayjs from 'dayjs'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  date: string
  accountCategory: string
  partnerName: string
  amountYen: number
  memo: string | null
  attachmentUrl: string | null
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  })

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const res = await fetch(`/api/transactions?${params.toString()}`)
      const data = await res.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const handleDelete = async (id: string) => {
    if (!confirm('この取引を削除しますか？')) return

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('削除に失敗しました')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">取引一覧</h1>
        <Link href="/transactions/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          新規登録
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">種別</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">すべて</option>
              <option value="income">売上</option>
              <option value="expense">支出</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">開始日</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">終了日</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  type: '',
                  startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
                  endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
                })
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              リセット
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500">取引がありません</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">日付</th>
                <th className="px-4 py-3 text-left text-sm font-medium">種別</th>
                <th className="px-4 py-3 text-left text-sm font-medium">勘定科目</th>
                <th className="px-4 py-3 text-left text-sm font-medium">取引先</th>
                <th className="px-4 py-3 text-right text-sm font-medium">金額</th>
                <th className="px-4 py-3 text-left text-sm font-medium">メモ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {t.type === 'income' ? '売上' : '支出'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{t.accountCategory}</td>
                  <td className="px-4 py-3 text-sm">{t.partnerName}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(t.amountYen)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.memo || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/transactions/${t.id}`} className="text-green-600 hover:underline">
                        詳細
                      </Link>
                      <Link href={`/transactions/${t.id}/edit`} className="text-blue-600 hover:underline">
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:underline"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

