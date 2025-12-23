'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

interface Client {
  id: string
  name: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPriceYen: number
  amountYen: number
  taxRate: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    notes: '',
    bankAccount: '',
  })
  const [itemForm, setItemForm] = useState({
    description: '',
    quantity: '1',
    unitPriceYen: '',
    taxRate: '0.1',
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients')
        const data = await res.json()
        setClients(data)
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    }
    fetchClients()
  }, [])

  const createInvoice = async () => {
    if (!formData.clientId) {
      alert('顧客を選択してください')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setInvoiceId(data.id)
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '請求書の作成に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('請求書の作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    if (!invoiceId) {
      await createInvoice()
      return
    }

    if (!itemForm.description || !itemForm.quantity || !itemForm.unitPriceYen) {
      alert('明細の必須項目を入力してください')
      return
    }

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/items`, {
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
        const newItem = await res.json()
        setItems([...items, newItem])
        setItemForm({
          description: '',
          quantity: '1',
          unitPriceYen: '',
          taxRate: '0.1',
        })
        // 請求書を再取得して合計を更新
        const invoiceRes = await fetch(`/api/invoices/${invoiceId}`)
        if (invoiceRes.ok) {
          const invoice = await invoiceRes.json()
          setItems(invoice.items)
        }
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '明細の追加に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('明細の追加に失敗しました')
    }
  }

  const removeItem = async (itemId: string) => {
    if (!invoiceId) return

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setItems(items.filter((item) => item.id !== itemId))
        // 請求書を再取得して合計を更新
        const invoiceRes = await fetch(`/api/invoices/${invoiceId}`)
        if (invoiceRes.ok) {
          const invoice = await invoiceRes.json()
          setItems(invoice.items)
        }
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert('明細の削除に失敗しました')
    }
  }

  const calculateTotals = () => {
    let subtotal = 0
    let tax = 0
    for (const item of items) {
      subtotal += item.amountYen
      tax += Math.floor(item.amountYen * item.taxRate)
    }
    return { subtotal, tax, total: subtotal + tax }
  }

  const totals = calculateTotals()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">請求書を作成</h1>

      <div className="bg-white p-6 rounded-lg shadow max-w-4xl">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">顧客 *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">選択してください</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
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
              placeholder="例: みずほ銀行 〇〇支店 普通 1234567"
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
        </div>

        <div className="border-t pt-6 mb-6">
          <h2 className="text-xl font-bold mb-4">明細</h2>

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
                onClick={addItem}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                追加
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border rounded">
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
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-right">{item.unitPriceYen.toLocaleString()}円</td>
                      <td className="px-4 py-2 text-sm text-right">{(item.taxRate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-2 text-sm text-right">{item.amountYen.toLocaleString()}円</td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>税抜合計:</span>
                  <span className="font-medium">{totals.subtotal.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between">
                  <span>税額:</span>
                  <span className="font-medium">{totals.tax.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>合計:</span>
                  <span>{totals.total.toLocaleString()}円</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6 border-t mt-6">
          {invoiceId && (
            <>
              <Link
                href={`/invoices/${invoiceId}`}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                保存して詳細へ
              </Link>
              <Link
                href={`/invoices/${invoiceId}/pdf`}
                className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
              >
                PDFを表示
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

