'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

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
}

interface Invoice {
  id: string
  client: Client
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid'
  subtotalYen: number
  taxYen: number
  totalYen: number
  items: InvoiceItem[]
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('この請求書を削除しますか？')) return

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('削除に失敗しました')
    }
  }

  const filteredInvoices = statusFilter
    ? invoices.filter((inv) => inv.status === statusFilter)
    : invoices

  const statusLabels: Record<string, string> = {
    draft: '下書き',
    sent: '送付済',
    paid: '入金済',
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">請求書一覧</h1>
        <Link href="/invoices/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          新規作成
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">ステータス</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">すべて</option>
            <option value="draft">下書き</option>
            <option value="sent">送付済</option>
            <option value="paid">入金済</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : filteredInvoices.length === 0 ? (
        <p className="text-gray-500">請求書がありません</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">発行日</th>
                <th className="px-4 py-3 text-left text-sm font-medium">顧客</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ステータス</th>
                <th className="px-4 py-3 text-right text-sm font-medium">合計金額</th>
                <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 py-3 text-sm">{inv.client.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded ${statusColors[inv.status]}`}>
                      {statusLabels[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(inv.totalYen)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                        詳細
                      </Link>
                      <Link href={`/invoices/${inv.id}/edit`} className="text-purple-600 hover:underline">
                        編集
                      </Link>
                      <Link href={`/invoices/${inv.id}/pdf`} className="text-green-600 hover:underline">
                        PDF
                      </Link>
                      <button
                        onClick={() => handleDelete(inv.id)}
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

