'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  date: string
  accountCategory: string
  partnerName: string
  amountYen: number
  memo: string | null
  attachmentUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await fetch(`/api/transactions/${id}`)
        if (res.ok) {
          const data = await res.json()
          setTransaction(data)
        } else if (res.status === 404) {
          router.push('/not-found')
        } else {
          console.error('Error fetching transaction:', res.statusText)
        }
      } catch (error) {
        console.error('Error fetching transaction:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchTransaction()
  }, [id, router])

  if (loading) {
    return <p>読み込み中...</p>
  }

  if (!transaction) {
    return <p>取引が見つかりません</p>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">取引詳細</h1>
        <div className="flex gap-2">
          <Link
            href={`/transactions/${id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            編集
          </Link>
          <button
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            戻る
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">種別</label>
              <p className="text-lg">
                <span className={`px-3 py-1 rounded ${
                  transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type === 'income' ? '売上' : '支出'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">日付</label>
              <p className="text-lg">{formatDate(transaction.date)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">勘定科目</label>
              <p className="text-lg">{transaction.accountCategory}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">取引先</label>
              <p className="text-lg">{transaction.partnerName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">金額</label>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(transaction.amountYen)}</p>
            </div>

            {transaction.memo && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">メモ</label>
                <p className="text-lg">{transaction.memo}</p>
              </div>
            )}

            {transaction.attachmentUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">添付URL</label>
                <a
                  href={transaction.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {transaction.attachmentUrl}
                </a>
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="text-sm text-gray-500">
              <p>作成日時: {formatDate(transaction.createdAt)}</p>
              <p>更新日時: {formatDate(transaction.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

