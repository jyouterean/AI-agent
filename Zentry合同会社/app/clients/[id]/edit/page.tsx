'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string | null
  address: string | null
  invoiceRegNo: string | null
}

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    invoiceRegNo: '',
  })

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${id}`)
        if (res.ok) {
          const data: Client = await res.json()
          setFormData({
            name: data.name,
            email: data.email || '',
            address: data.address || '',
            invoiceRegNo: data.invoiceRegNo || '',
          })
        }
      } catch (error) {
        console.error('Error fetching client:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchClient()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email || undefined,
          address: formData.address || undefined,
          invoiceRegNo: formData.invoiceRegNo || undefined,
        }),
      })

      if (res.ok) {
        router.push('/clients')
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '更新に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error updating client:', error)
      alert('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>読み込み中...</p>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">顧客を編集</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">顧客名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">住所</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">適格請求書発行事業者番号</label>
            <input
              type="text"
              value={formData.invoiceRegNo}
              onChange={(e) => setFormData({ ...formData, invoiceRegNo: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="T1234567890123"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? '更新中...' : '更新'}
            </button>
            <Link
              href="/clients"
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 inline-block text-center"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

