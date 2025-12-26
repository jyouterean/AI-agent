import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { AIProviderFactory, ProviderType } from '@/lib/ai/provider-factory'
import { AITool } from '@/lib/ai/providers/base'

// 会社情報（カスタマイズ用）
const companyInfo = {
  name: process.env.COMPANY_NAME || '自社',
  address: process.env.COMPANY_ADDRESS || '',
  email: process.env.COMPANY_EMAIL || '',
  invoiceRegNo: process.env.COMPANY_INVOICE_REG_NO || '',
  defaultTaxRate: Number(process.env.COMPANY_DEFAULT_TAX_RATE || '0.1'),
  defaultPaymentTermDays: Number(process.env.COMPANY_DEFAULT_PAYMENT_TERM_DAYS || '30'),
}

// ツール定義のスキーマ
const toolSchemas = {
  create_transaction: z.object({
    type: z.enum(['income', 'expense']),
    date: z.string(),
    accountCategory: z.string(),
    partnerName: z.string(),
    amountYen: z.number().int().positive(),
    memo: z.string().optional(),
  }),
  create_invoice_draft: z.object({
    clientName: z.string(),
    issueDate: z.string(),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
    bankAccount: z.string().optional(),
  }),
  add_invoice_item: z.object({
    invoiceId: z.string(),
    description: z.string(),
    quantity: z.number().int().positive(),
    unitPriceYen: z.number().int().positive(),
    taxRate: z.number().refine((n) => n === 0 || n === 0.08 || n === 0.1),
  }),
  search_client: z.object({
    name: z.string(),
  }),
  create_client: z.object({
    name: z.string(),
    email: z.string().optional(),
    address: z.string().optional(),
    invoiceRegNo: z.string().optional(),
  }),
  update_invoice_status: z.object({
    invoiceId: z.string(),
    status: z.enum(['draft', 'sent', 'paid']),
  }),
  update_transaction: z.object({
    id: z.string(),
    type: z.enum(['income', 'expense']).optional(),
    date: z.string().optional(),
    accountCategory: z.string().optional(),
    partnerName: z.string().optional(),
    amountYen: z.number().int().positive().optional(),
    memo: z.string().optional(),
  }),
  save_to_notion: z.object({
    databaseId: z.string().min(1),
    title: z.string().min(1),
    content: z.string().optional(),
    properties: z.record(z.any()).optional(),
  }),
  search_notion: z.object({
    databaseId: z.string().min(1),
    query: z.string().min(1),
  }),
  create_task: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  update_task: z.object({
    id: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  }),
  search_task: z.object({
    query: z.string().min(1).optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
}

// ツール定義を生成
function getTools(): AITool[] {
  const tools: AITool[] = [
    {
      type: 'function',
      function: {
        name: 'create_transaction',
        description: '取引（売上または支出）を登録します',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['income', 'expense'] },
            date: { type: 'string', description: 'YYYY-MM-DD形式の日付' },
            accountCategory: { type: 'string', description: '勘定科目（例: ガソリン代、売上、交通費）' },
            partnerName: { type: 'string', description: '取引先名' },
            amountYen: { type: 'number', description: '金額（円、整数）' },
            memo: { type: 'string', description: 'メモ（任意）' },
          },
          required: ['type', 'date', 'accountCategory', 'partnerName', 'amountYen'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_invoice_draft',
        description: '請求書の下書きを作成します',
        parameters: {
          type: 'object',
          properties: {
            clientName: { type: 'string', description: '顧客名' },
            issueDate: { type: 'string', description: 'YYYY-MM-DD形式の発行日' },
            dueDate: { type: 'string', description: 'YYYY-MM-DD形式の支払期限（任意、デフォルトは発行日+30日）' },
            notes: { type: 'string', description: '備考（任意）' },
            bankAccount: { type: 'string', description: '振込先（任意）' },
          },
          required: ['clientName', 'issueDate'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'add_invoice_item',
        description: '請求書に明細を追加します',
        parameters: {
          type: 'object',
          properties: {
            invoiceId: { type: 'string', description: '請求書ID' },
            description: { type: 'string', description: '明細名' },
            quantity: { type: 'number', description: '数量' },
            unitPriceYen: { type: 'number', description: '単価（円、整数）' },
            taxRate: { type: 'number', description: '税率（0, 0.08, 0.1）' },
          },
          required: ['invoiceId', 'description', 'quantity', 'unitPriceYen', 'taxRate'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_client',
        description: '顧客を検索します',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '顧客名（部分一致可）' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_client',
        description: '新しい顧客を登録します',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '顧客名' },
            email: { type: 'string', description: 'メールアドレス（任意）' },
            address: { type: 'string', description: '住所（任意）' },
            invoiceRegNo: { type: 'string', description: '適格請求書発行事業者番号（任意）' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_invoice_status',
        description: '既存の請求書のステータスを更新します',
        parameters: {
          type: 'object',
          properties: {
            invoiceId: { type: 'string', description: '請求書ID' },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'paid'],
              description: '新しいステータス',
            },
          },
          required: ['invoiceId', 'status'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_transaction',
        description: '既存の取引を更新します',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '取引ID' },
            type: { type: 'string', enum: ['income', 'expense'] },
            date: { type: 'string', description: 'YYYY-MM-DD形式の日付' },
            accountCategory: { type: 'string', description: '勘定科目' },
            partnerName: { type: 'string', description: '取引先名' },
            amountYen: { type: 'number', description: '金額（円、整数）' },
            memo: { type: 'string', description: 'メモ（任意）' },
          },
          required: ['id'],
        },
      },
    },
  ]

  // Notion APIが利用可能な場合、Notion関連のツールを追加
  if (process.env.NOTION_API_KEY) {
    tools.push(
      {
        type: 'function',
        function: {
          name: 'save_to_notion',
          description: 'Notionデータベースに情報を保存します。取引、請求書、顧客情報などをNotionに記録できます。データベースIDが指定されていない場合は、環境変数NOTION_DATABASE_IDを使用します。',
          parameters: {
            type: 'object',
            properties: {
              databaseId: { type: 'string', description: 'NotionデータベースID（任意、デフォルトは環境変数から取得）' },
              title: { type: 'string', description: 'ページタイトル' },
              content: { type: 'string', description: 'ページの内容（任意）' },
              properties: { type: 'object', description: 'データベースのプロパティ（任意）' },
            },
            required: ['title'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_notion',
          description: 'Notionデータベースから情報を検索します。過去の取引や請求書情報を検索できます。データベースIDが指定されていない場合は、環境変数NOTION_DATABASE_IDを使用します。',
          parameters: {
            type: 'object',
            properties: {
              databaseId: { type: 'string', description: 'NotionデータベースID（任意、デフォルトは環境変数から取得）' },
              query: { type: 'string', description: '検索クエリ' },
            },
            required: ['query'],
          },
        },
      }
    )

  }

  // タスク管理ツールを追加（常に利用可能）
  tools.push(
    {
      type: 'function',
      function: {
        name: 'create_task',
        description: '新しいタスクを作成します。タイトル、説明、ステータス、優先度、期限、タグを設定できます。',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'タスクのタイトル（必須）' },
            description: { type: 'string', description: 'タスクの説明（任意）' },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
              description: 'ステータス（任意、デフォルト: not_started）',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: '優先度（任意、デフォルト: medium）',
            },
            dueDate: { type: 'string', description: '期限（YYYY-MM-DD形式、任意）' },
            tags: { type: 'array', items: { type: 'string' }, description: 'タグ（任意）' },
          },
          required: ['title'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_task',
        description: '既存のタスクを更新します。タスクIDを指定して、タイトル、説明、ステータス、優先度、期限、タグを更新できます。',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'タスクID（必須）' },
            title: { type: 'string', description: 'タスクのタイトル（任意）' },
            description: { type: 'string', description: 'タスクの説明（任意）' },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
              description: 'ステータス（任意）',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: '優先度（任意）',
            },
            dueDate: { type: 'string', description: '期限（YYYY-MM-DD形式、任意、nullで削除）' },
            tags: { type: 'array', items: { type: 'string' }, description: 'タグ（任意）' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_task',
        description: 'タスクを検索します。クエリ、ステータス、優先度でフィルタリングできます。',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '検索クエリ（タイトルで検索、任意）' },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
              description: 'ステータスでフィルタリング（任意）',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: '優先度でフィルタリング（任意）',
            },
          },
        },
      },
    }
  )

  return tools
}

export async function POST(request: NextRequest) {
  try {
    const { messages, context, providerType } = await request.json()

    // プロバイダータイプを決定
    const selectedProvider: ProviderType = providerType || AIProviderFactory.getDefaultProvider()

    // コンテキスト情報を取得
    const recentTransactions = await prisma.transactions.findMany({
      take: 10,
      orderBy: { date: 'desc' },
    })

    const clients = await prisma.clients.findMany({
      take: 20,
      orderBy: { name: 'asc' },
    })

    const recentInvoices = await prisma.invoices.findMany({
      take: 10,
      orderBy: { issueDate: 'desc' },
      include: { clients: true },
    })

    // システムプロンプトを構築
    let systemPrompt = `あなたは${companyInfo.name}の経理管理を支援するAIアシスタントです。
ユーザーの自然言語の指示を理解し、${companyInfo.name}の業務ルールに沿って適切なアクションを提案してください。

利用可能なツール:
1. create_transaction: 取引（売上/支出）を登録
2. create_invoice_draft: 請求書の下書きを作成
3. add_invoice_item: 請求書に明細を追加
4. search_client: 顧客を検索
5. create_client: 新しい顧客を登録
6. update_invoice_status: 請求書のステータスを更新
7. update_transaction: 既存の取引を更新`

    // Notion APIが利用可能な場合、Notion関連の機能を追加
    if (process.env.NOTION_API_KEY) {
      systemPrompt += `
8. save_to_notion: Notionデータベースに情報を保存（取引、請求書、顧客情報など）
9. search_notion: Notionデータベースから情報を検索`
    }

    // タスク管理機能を追加（常に利用可能）
    systemPrompt += `
10. create_task: 新しいタスクを作成（タイトル、説明、ステータス、優先度、期限、タグを設定可能）
11. update_task: 既存のタスクを更新（ステータス変更、優先度変更、期限更新など）
12. search_task: タスクを検索（クエリ、ステータス、優先度でフィルタリング可能）`

    systemPrompt += `

重要なルール:
- 日付が指定されていない場合は、今日の日付を使用するか、ユーザーに確認する
- 税率が指定されていない場合は、${companyInfo.defaultTaxRate * 100}% をデフォルトとする（ただし、ユーザーに確認する方が良い）
- 顧客名が曖昧な場合は、search_clientで検索するか、ユーザーに確認する
- すべてのアクションは「確定アクション」として返し、ユーザーが承認してから実行される
- Notionへの保存や検索が必要な場合は、適切なツールを使用してください

会社情報（回答時の文面や請求書作成時の前提として利用できます）:
- 社名: ${companyInfo.name}
- 住所: ${companyInfo.address}
- メールアドレス: ${companyInfo.email}
- 適格請求書発行事業者番号: ${companyInfo.invoiceRegNo}
- デフォルト税率: ${companyInfo.defaultTaxRate}
- 標準的な支払期限: 発行日から${companyInfo.defaultPaymentTermDays}日後

現在のコンテキスト:
- 直近の取引: ${JSON.stringify(recentTransactions.slice(0, 5).map(t => ({
      type: t.type,
      date: t.date,
      partnerName: t.partnerName,
      amountYen: t.amountYen,
    })))}
- 顧客一覧: ${clients.map(c => c.name).join(', ')}
- 直近の請求書: ${recentInvoices.slice(0, 3).map(inv => ({
      id: inv.id,
      client: inv.clients.name,
      totalYen: inv.totalYen,
      status: inv.status,
    }))}

日本語で自然に応答してください。`

    // プロバイダーを作成
    const provider = AIProviderFactory.createProvider(selectedProvider, {
      apiKey: selectedProvider === 'openai' || selectedProvider === 'hybrid' 
        ? process.env.OPENAI_API_KEY 
        : process.env.NOTION_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      databaseId: process.env.NOTION_DATABASE_ID,
    })

    // ツールを取得
    const tools = getTools()

    // ハイブリッドモードの場合、OpenAIを使用してNotion APIと連携
    if (selectedProvider === 'hybrid') {
      const completion = await provider.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        tools,
        'auto'
      )

      const toolCalls = completion.toolCalls || []

      // ツール呼び出しを検証
      const validatedToolCalls = toolCalls.map((call) => {
        const functionName = call.function.name as keyof typeof toolSchemas
        const schema = toolSchemas[functionName]

        if (!schema) {
          console.error(`Unknown tool: ${functionName}`)
          return null
        }

        try {
          const args = JSON.parse(call.function.arguments)
          const validated = schema.parse(args)

          return {
            id: call.id,
            type: call.type,
            function: {
              name: functionName,
              arguments: validated,
            },
          }
        } catch (error) {
          console.error(`Validation error for ${functionName}:`, error)
          return null
        }
      }).filter(Boolean)

      return NextResponse.json({
        role: 'assistant',
        content: completion.content || '以下のアクションを実行しますか？',
        toolCalls: validatedToolCalls,
        provider: selectedProvider,
      })
    }

    // 通常のプロバイダー（OpenAIまたはNotion）
    const completion = await provider.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      tools,
      'auto'
    )

    const toolCalls = completion.toolCalls || []

    // ツール呼び出しを検証
    const validatedToolCalls = toolCalls.map((call) => {
      const functionName = call.function.name as keyof typeof toolSchemas
      const schema = toolSchemas[functionName]

      if (!schema) {
        console.error(`Unknown tool: ${functionName}`)
        return null
      }

      try {
        const args = JSON.parse(call.function.arguments)
        const validated = schema.parse(args)

        return {
          id: call.id,
          type: call.type,
          function: {
            name: functionName,
            arguments: validated,
          },
        }
      } catch (error) {
        console.error(`Validation error for ${functionName}:`, error)
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({
      role: 'assistant',
      content: completion.content || (validatedToolCalls.length > 0 ? '以下のアクションを実行しますか？' : null),
      toolCalls: validatedToolCalls,
      provider: selectedProvider,
    })
  } catch (error) {
    console.error('Error in agent API:', error)
    return NextResponse.json(
      { error: 'AIエージェントの処理に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
