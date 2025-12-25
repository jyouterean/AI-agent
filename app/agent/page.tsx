'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{
    id: string
    type: string
    function: {
      name: string
      arguments: any
    }
  }>
}

interface PendingAction {
  toolCallId: string
  functionName: string
  arguments: any
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'こんにちは！経理管理をお手伝いします。取引の登録や請求書の作成など、何でもお聞きください。',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [providerType, setProviderType] = useState<'openai' | 'notion' | 'hybrid'>('openai')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          providerType,
        }),
      })

      const data = await res.json()

      if (data.toolCalls && data.toolCalls.length > 0) {
        // ツール呼び出しがある場合、承認待ちにする
        const actions: PendingAction[] = data.toolCalls.map((call: any) => ({
          toolCallId: call.id,
          functionName: call.function.name,
          arguments: call.function.arguments,
        }))

        setPendingActions(actions)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.content || '以下のアクションを実行しますか？',
            toolCalls: data.toolCalls,
          },
        ])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
      }
    } catch (error) {
      console.error('Error calling agent:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (pendingActions.length === 0) return

    setLoading(true)

    try {
      for (const action of pendingActions) {
        const res = await fetch('/api/agent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action.functionName,
            params: action.arguments,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          let errorMessage = error.error || '実行に失敗しました'
          if (error.details && Array.isArray(error.details)) {
            errorMessage += '\n詳細: ' + error.details.map((d: any) => `${d.path?.join('.') || ''}: ${d.message}`).join(', ')
          }
          throw new Error(errorMessage)
        }

        const result = await res.json()

        let successMessage = `✅ ${getActionLabel(action.functionName)}を実行しました。`
        
        if (action.functionName === 'search_client') {
          const clients = result.data || []
          if (clients.length > 0) {
            successMessage += `\n\n見つかった顧客:\n${clients.map((c: any) => `- ${c.name}${c.email ? ` (${c.email})` : ''}`).join('\n')}`
          } else {
            successMessage += `\n\n該当する顧客が見つかりませんでした。`
          }
        } else if (action.functionName === 'save_to_notion') {
          if (result.data?.url) {
            successMessage += `\n\nNotionページ: ${result.data.url}`
          }
        } else if (action.functionName === 'search_notion') {
          const results = result.data?.results || []
          if (results.length > 0) {
            successMessage += `\n\n見つかった結果: ${results.length}件`
            results.slice(0, 5).forEach((r: any) => {
              successMessage += `\n- ${r.url || r.id}`
            })
          } else {
            successMessage += `\n\n該当する結果が見つかりませんでした。`
          }
        } else if (result.data?.id) {
          successMessage += ` ID: ${result.data.id}`
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: successMessage,
          },
        ])
      }

      setPendingActions([])
    } catch (error) {
      console.error('Error executing actions:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ エラー: ${error instanceof Error ? error.message : '実行に失敗しました'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleReject = () => {
    setPendingActions([])
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '了解しました。アクションをキャンセルしました。' },
    ])
  }

  const getActionLabel = (functionName: string): string => {
    const labels: Record<string, string> = {
      create_transaction: '取引の登録',
      create_invoice_draft: '請求書の作成',
      add_invoice_item: '請求書明細の追加',
      search_client: '顧客の検索',
      create_client: '顧客の登録',
      update_invoice_status: '請求書ステータスの更新',
      update_transaction: '取引の更新',
      save_to_notion: 'Notionに保存',
      search_notion: 'Notionを検索',
      'notion-sync': 'Notion同期',
    }
    return labels[functionName] || functionName
  }

  const formatActionPreview = (action: PendingAction): string => {
    const args = action.arguments
    switch (action.functionName) {
      case 'create_transaction':
        return `${args.type === 'income' ? '売上' : '支出'}: ${args.partnerName} - ${args.accountCategory} - ${args.amountYen.toLocaleString()}円 (${args.date})`
      case 'create_invoice_draft':
        return `請求書作成: ${args.clientName} - 発行日: ${args.issueDate}`
      case 'add_invoice_item':
        return `明細追加: ${args.description} - ${args.quantity} × ${args.unitPriceYen.toLocaleString()}円 (税率: ${(args.taxRate * 100).toFixed(0)}%)`
      case 'create_client':
        return `顧客登録: ${args.name}${
          args.invoiceRegNo ? ` / 登録番号: ${args.invoiceRegNo}` : ''
        }`
      case 'update_invoice_status':
        return `請求書ステータス更新: ID=${args.invoiceId} -> ${args.status}`
      case 'update_transaction':
        return `取引更新: ID=${args.id}`
      case 'search_client':
        return `顧客検索: "${args.name}"`
      case 'save_to_notion':
        return `Notionに保存: ${args.title} (データベースID: ${args.databaseId})`
      case 'search_notion':
        return `Notion検索: "${args.query}" (データベースID: ${args.databaseId})`
      default:
        return JSON.stringify(args)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AIエージェント</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">AIプロバイダー:</label>
          <select
            value={providerType}
            onChange={(e) => setProviderType(e.target.value as 'openai' | 'notion' | 'hybrid')}
            className="border rounded px-3 py-1 text-sm"
            disabled={loading}
          >
            <option value="openai">OpenAI</option>
            <option value="notion">Notion API</option>
            <option value="hybrid">Hybrid (OpenAI + Notion)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow p-4 mb-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="text-sm font-medium mb-2">提案されたアクション:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {msg.toolCalls.map((call) => (
                        <li key={call.id}>
                          {getActionLabel(call.function.name)}: {JSON.stringify(call.function.arguments, null, 2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <p>考え中...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {pendingActions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-bold mb-2">承認待ちのアクション</h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {pendingActions.map((action, idx) => (
              <li key={idx} className="text-sm">
                {formatActionPreview(action)}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              承認して実行
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="例: 12/20にガソリン代 6500円、支出で登録して"
          className="flex-1 border rounded px-4 py-2"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </div>
  )
}

