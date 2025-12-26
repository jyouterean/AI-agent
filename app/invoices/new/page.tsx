'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dayjs from 'dayjs'

interface Client {
  id: string
  name: string
  address?: string
}

interface InvoiceItem {
  id: string
  name: string
  quantity: number
  unit_cost: number
  tax_rate: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    notes: '',
    logoUrl: '',
  })
  const [itemForm, setItemForm] = useState({
    name: '',
    quantity: '1',
    unit_cost: '',
    tax_rate: '0.1',
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

    // 請求書番号を自動生成（例: INV-YYYYMMDD-001）
    const dateStr = dayjs().format('YYYYMMDD')
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setInvoiceNumber(`INV-${dateStr}-${randomNum}`)
  }, [])

  const selectedClient = clients.find((c) => c.id === formData.clientId)

  const addItem = () => {
    if (!itemForm.name || !itemForm.quantity || !itemForm.unit_cost) {
      alert('明細の必須項目を入力してください')
      return
    }

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: itemForm.name,
      quantity: parseInt(itemForm.quantity),
      unit_cost: parseInt(itemForm.unit_cost),
      tax_rate: parseFloat(itemForm.tax_rate),
    }

    setItems([...items, newItem])
    setItemForm({
      name: '',
      quantity: '1',
      unit_cost: '',
      tax_rate: '0.1',
    })
  }

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const calculateTotals = () => {
    let subtotal = 0
    let tax = 0
    for (const item of items) {
      const itemSubtotal = item.quantity * item.unit_cost
      subtotal += itemSubtotal
      tax += Math.floor(itemSubtotal * item.tax_rate)
    }
    return { subtotal, tax, total: subtotal + tax }
  }

  const totals = calculateTotals()

  const generatePDF = async () => {
    if (!formData.clientId) {
      alert('顧客を選択してください')
      return
    }

    if (items.length === 0) {
      alert('明細を最低1件追加してください')
      return
    }

    if (!invoiceNumber) {
      alert('請求書番号を入力してください')
      return
    }

    setGenerating(true)
    setPdfUrl(null)

    try {
      // 会社情報を取得（API経由で取得するか、クライアント側で取得）
      // ここでは簡易的にAPI経由で取得
      const companyRes = await fetch('/api/company-info')
      let companyInfo
      if (companyRes.ok) {
        companyInfo = await companyRes.json()
      } else {
        // フォールバック
        companyInfo = {
          name: '株式会社サンプル',
          address: '〒123-4567\n東京都新宿区\nサンプルビル',
        }
      }

      // 税率を決定（すべてのアイテムが同じ税率ならその値、異なる場合は最初のアイテムの税率を使用）
      const taxRate = items.length > 0 ? items[0].tax_rate : 0.1

      // Invoice Generator APIへのリクエストデータを構築
      const invoiceData = {
        from: `${companyInfo.name}\n${companyInfo.address}`,
        to: selectedClient
          ? `${selectedClient.name}\n${selectedClient.address || ''}`
          : '請求先情報未設定',
        logo: formData.logoUrl || undefined,
        number: invoiceNumber,
        date: formData.issueDate,
        due_date: formData.dueDate,
        currency: 'JPY',
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
        tax: taxRate,
        notes: formData.notes || undefined,
      }

      // Invoice Generator APIを呼び出し
      const res = await fetch('/api/invoice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      })

      const result = await res.json()

      if (result.success && result.pdf_url) {
        setPdfUrl(result.pdf_url)
      } else {
        alert(`PDF生成エラー: ${result.message || '請求書PDFの生成に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('請求書PDFの生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

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

          <div>
            <label className="block text-sm font-medium mb-1">請求書番号 *</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="例: INV-2024-001"
              required
            />
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
            <label className="block text-sm font-medium mb-1">ロゴURL（任意）</label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">備考</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="備考を入力してください"
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
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="例: ウェブサイト開発"
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
                value={itemForm.unit_cost}
                onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })}
                className="w-full border rounded px-3 py-2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">税率</label>
              <select
                value={itemForm.tax_rate}
                onChange={(e) => setItemForm({ ...itemForm, tax_rate: e.target.value })}
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
                  {items.map((item) => {
                    const itemTotal = item.quantity * item.unit_cost
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.unit_cost.toLocaleString()}円</td>
                        <td className="px-4 py-2 text-sm text-right">{(item.tax_rate * 100).toFixed(0)}%</td>
                        <td className="px-4 py-2 text-sm text-right">{itemTotal.toLocaleString()}円</td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:underline"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 mb-6">
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

        {pdfUrl && (
          <div className="border-t pt-6 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-800 mb-2">PDFが生成されました</h3>
              <div className="flex gap-4">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  PDFを表示
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  PDFをダウンロード
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6 border-t mt-6">
          <button
            type="button"
            onClick={generatePDF}
            disabled={generating || items.length === 0 || !formData.clientId}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'PDF生成中...' : 'PDFを生成'}
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
    </div>
  )
}

