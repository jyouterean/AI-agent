'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  invoiceRegNo: string | null
}

interface Invoice {
  id: string
  clients: Client
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid'
  subtotalYen: number
  taxYen: number
  totalYen: number
  notes: string | null
  bankAccount: string | null
  invoice_items: InvoiceItem[]
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`)
        if (res.ok) {
          const data = await res.json()
          setInvoice(data)
        } else if (res.status === 404) {
          router.push('/not-found')
        } else {
          console.error('Error fetching invoice:', res.statusText)
        }
      } catch (error) {
        console.error('Error fetching invoice:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchInvoice()
  }, [id, router])

  const updateStatus = async (status: 'draft' | 'sent' | 'paid') => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const data = await res.json()
        setInvoice(data)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('ステータスの更新に失敗しました')
    }
  }

  if (loading) {
    return <p>読み込み中...</p>
  }

  if (!invoice) {
    return <p>請求書が見つかりません</p>
  }

  const statusLabels: Record<string, string> = {
    draft: '下書き',
    sent: '送付済',
    paid: '入金済',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">請求書詳細</h1>
        <div className="flex gap-2">
          <Link
            href={`/invoices/${id}/edit`}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            編集
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/invoices/${id}/pdf`}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </Link>
            <a
              href={`/api/invoices/${id}/excel`}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </a>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            戻る
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">請求書</h2>
              <p className="text-gray-600 mt-2">
                ステータス: <span className="font-medium">{statusLabels[invoice.status]}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">発行日: {formatDate(invoice.issueDate)}</p>
              <p className="text-sm text-gray-600">支払期限: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold mb-2">請求先</h3>
            <p className="text-sm">{invoice.clients.name}</p>
            {invoice.clients.address && <p className="text-sm text-gray-600">{invoice.clients.address}</p>}
            {invoice.clients.email && <p className="text-sm text-gray-600">{invoice.clients.email}</p>}
            {invoice.clients.invoiceRegNo && (
              <p className="text-sm text-gray-600">適格請求書発行事業者番号: {invoice.clients.invoiceRegNo}</p>
            )}
          </div>
        </div>

        <div className="border-t pt-4 mb-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">明細名</th>
                <th className="px-4 py-2 text-right text-sm font-medium">数量</th>
                <th className="px-4 py-2 text-right text-sm font-medium">単価</th>
                <th className="px-4 py-2 text-right text-sm font-medium">税率</th>
                <th className="px-4 py-2 text-right text-sm font-medium">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.invoice_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm">{item.description}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.unitPriceYen.toLocaleString()}円</td>
                  <td className="px-4 py-2 text-sm text-right">{(item.taxRate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-sm text-right">{item.amountYen.toLocaleString()}円</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>税抜合計:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotalYen)}</span>
              </div>
              <div className="flex justify-between">
                <span>税額:</span>
                <span className="font-medium">{formatCurrency(invoice.taxYen)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>合計:</span>
                <span>{formatCurrency(invoice.totalYen)}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.bankAccount && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm">
              <span className="font-medium">振込先:</span> {invoice.bankAccount}
            </p>
          </div>
        )}

        {invoice.notes && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm">
              <span className="font-medium">備考:</span> {invoice.notes}
            </p>
          </div>
        )}

        <div className="border-t pt-4 mt-6">
          <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <button
                onClick={() => updateStatus('sent')}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                送付済みに変更
              </button>
            )}
            {invoice.status === 'sent' && (
              <button
                onClick={() => updateStatus('paid')}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                入金済みに変更
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

