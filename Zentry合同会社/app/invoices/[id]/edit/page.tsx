'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import dayjs from 'dayjs'

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
}

interface Invoice {
  id: string
  client: Client
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid'
  notes: string | null
  bankAccount: string | null
  items: InvoiceItem[]
}

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    issueDate: '',
    dueDate: '',
    notes: '',
    bankAccount: '',
  })
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({
    description: '',
    quantity: '',
    unitPriceYen: '',
    taxRate: '0.1',
  })

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`)
        if (res.ok) {
          const data = await res.json()
          setInvoice(data)
          setFormData({
            issueDate: dayjs(data.issueDate).format('YYYY-MM-DD'),
            dueDate: dayjs(data.dueDate).format('YYYY-MM-DD'),
            notes: data.notes || '',
            bankAccount: data.bankAccount || '',
          })
        }
      } catch (error) {
        console.error('Error fetching invoice:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchInvoice()
  }, [id])

  const handleUpdateInvoice = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setInvoice(data)
        alert('請求書を更新しました')
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '更新に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleEditItem = (item: InvoiceItem) => {
    setEditingItem(item.id)
    setItemForm({
      description: item.description,
      quantity: item.quantity.toString(),
      unitPriceYen: item.unitPriceYen.toString(),
      taxRate: item.taxRate.toString(),
    })
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return

    try {
      const res = await fetch(`/api/invoices/${id}/items/${editingItem}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          quantity: parseInt(itemForm.quantity),
          unitPriceYen: parseInt(itemForm.unitPriceYen),
          taxRate: parseFloat(itemForm.taxRate),
        }),
      })

      if (res.ok) {
        const invoiceRes = await fetch(`/api/invoices/${id}`)
        if (invoiceRes.ok) {
          const data = await invoiceRes.json()
          setInvoice(data)
          setEditingItem(null)
          setItemForm({ description: '', quantity: '', unitPriceYen: '', taxRate: '0.1' })
        }
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '明細の更新に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('明細の更新に失敗しました')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('この明細を削除しますか？')) return

    try {
      const res = await fetch(`/api/invoices/${id}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        const invoiceRes = await fetch(`/api/invoices/${id}`)
        if (invoiceRes.ok) {
          const data = await invoiceRes.json()
          setInvoice(data)
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('明細の削除に失敗しました')
    }
  }

  if (loading) {
    return <p>読み込み中...</p>
  }

  if (!invoice) {
    return <p>請求書が見つかりません</p>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">請求書を編集</h1>
        <div className="flex gap-2">
          <Link
            href={`/invoices/${id}`}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            詳細に戻る
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">基本情報</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">顧客</label>
            <p className="text-gray-700">{invoice.client.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">発行日 *</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">支払期限 *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">振込先</label>
            <input
              type="text"
              value={formData.bankAccount}
              onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">備考</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <button
            onClick={handleUpdateInvoice}
            disabled={saving}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? '更新中...' : '基本情報を更新'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">明細</h2>

        {invoice.items.length === 0 ? (
          <p className="text-gray-500 mb-4">明細がありません</p>
        ) : (
          <div className="mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">明細名</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">数量</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">単価</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">税率</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">金額</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    {editingItem === item.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={itemForm.description}
                            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={itemForm.quantity}
                            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                            className="w-full border rounded px-2 py-1 text-sm"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={itemForm.unitPriceYen}
                            onChange={(e) => setItemForm({ ...itemForm, unitPriceYen: e.target.value })}
                            className="w-full border rounded px-2 py-1 text-sm"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={itemForm.taxRate}
                            onChange={(e) => setItemForm({ ...itemForm, taxRate: e.target.value })}
                            className="w-full border rounded px-2 py-1 text-sm"
                          >
                            <option value="0">0%</option>
                            <option value="0.08">8%</option>
                            <option value="0.1">10%</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          {(parseInt(itemForm.quantity || '0') * parseInt(itemForm.unitPriceYen || '0')).toLocaleString()}円
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateItem}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(null)
                                setItemForm({ description: '', quantity: '', unitPriceYen: '', taxRate: '0.1' })
                              }}
                              className="text-gray-600 hover:underline text-sm"
                            >
                              キャンセル
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-sm">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.unitPriceYen.toLocaleString()}円</td>
                        <td className="px-4 py-2 text-sm text-right">{(item.taxRate * 100).toFixed(0)}%</td>
                        <td className="px-4 py-2 text-sm text-right">{item.amountYen.toLocaleString()}円</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-bold mb-4">明細を追加</h3>
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">明細名 *</label>
              <input
                type="text"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="例: 開発費"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">数量 *</label>
              <input
                type="number"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                className="w-full border rounded px-3 py-2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">単価（円） *</label>
              <input
                type="number"
                value={itemForm.unitPriceYen}
                onChange={(e) => setItemForm({ ...itemForm, unitPriceYen: e.target.value })}
                className="w-full border rounded px-3 py-2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">税率</label>
              <select
                value={itemForm.taxRate}
                onChange={(e) => setItemForm({ ...itemForm, taxRate: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">0%</option>
                <option value="0.08">8%</option>
                <option value="0.1">10%</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={async () => {
                  if (!itemForm.description || !itemForm.quantity || !itemForm.unitPriceYen) {
                    alert('明細の必須項目を入力してください')
                    return
                  }

                  try {
                    const res = await fetch(`/api/invoices/${id}/items`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...itemForm,
                        quantity: parseInt(itemForm.quantity),
                        unitPriceYen: parseInt(itemForm.unitPriceYen),
                        taxRate: parseFloat(itemForm.taxRate),
                      }),
                    })

                    if (res.ok) {
                      const invoiceRes = await fetch(`/api/invoices/${id}`)
                      if (invoiceRes.ok) {
                        const data = await invoiceRes.json()
                        setInvoice(data)
                        setItemForm({ description: '', quantity: '1', unitPriceYen: '', taxRate: '0.1' })
                      }
                    } else {
                      const error = await res.json()
                      alert(`エラー: ${error.error || '明細の追加に失敗しました'}`)
                    }
                  } catch (error) {
                    console.error('Error adding item:', error)
                    alert('明細の追加に失敗しました')
                  }
                }}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                追加
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Link
            href={`/invoices/${id}`}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 inline-block"
          >
            詳細に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

