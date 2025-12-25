'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string | null
  address: string | null
  invoiceRegNo: string | null
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    invoiceRegNo: '',
  })

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email || undefined,
          address: formData.address || undefined,
          invoiceRegNo: formData.invoiceRegNo || undefined,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', email: '', address: '', invoiceRegNo: '' })
        fetchClients()
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '登録に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert('登録に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この顧客を削除しますか？関連する請求書も削除されます。')) return

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchClients()
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '削除に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('削除に失敗しました')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">顧客一覧</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'キャンセル' : '新規登録'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">顧客を登録</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                登録
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : clients.length === 0 ? (
        <p className="text-gray-500">顧客が登録されていません</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">顧客名</th>
                <th className="px-4 py-3 text-left text-sm font-medium">メール</th>
                <th className="px-4 py-3 text-left text-sm font-medium">住所</th>
                <th className="px-4 py-3 text-left text-sm font-medium">適格請求書発行事業者番号</th>
                <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-sm">{client.email || '-'}</td>
                  <td className="px-4 py-3 text-sm">{client.address || '-'}</td>
                  <td className="px-4 py-3 text-sm">{client.invoiceRegNo || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/clients/${client.id}/edit`} className="text-blue-600 hover:underline">
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(client.id)}
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

