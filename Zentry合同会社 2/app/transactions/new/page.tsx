'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

export default function NewTransactionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    date: dayjs().format('YYYY-MM-DD'),
    accountCategory: '',
    partnerName: '',
    amountYen: '',
    memo: '',
    attachmentUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amountYen: parseInt(formData.amountYen),
        }),
      })

      if (res.ok) {
        router.push('/transactions')
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '登録に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">取引を登録</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">種別 *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="income">売上</option>
              <option value="expense">支出</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">日付 *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">勘定科目 *</label>
            <input
              type="text"
              value={formData.accountCategory}
              onChange={(e) => setFormData({ ...formData, accountCategory: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="例: ガソリン代、売上、交通費"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">取引先 *</label>
            <input
              type="text"
              value={formData.partnerName}
              onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="例: A社、コンビニ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">金額（円） *</label>
            <input
              type="number"
              value={formData.amountYen}
              onChange={(e) => setFormData({ ...formData, amountYen: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="6500"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">メモ</label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">添付URL</label>
            <input
              type="url"
              value={formData.attachmentUrl}
              onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '登録中...' : '登録'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

