import { AIProvider, AIMessage, AITool, AICompletionResponse, AIProviderConfig } from './base'
import { OpenAIProvider } from './openai'
import { NotionProvider } from './notion'

/**
 * ハイブリッドプロバイダー（OpenAI + Notion API）
 * OpenAIの強力な言語理解能力とNotion APIのデータ管理機能を組み合わせます
 */
export class HybridProvider extends AIProvider {
  private openaiProvider: OpenAIProvider
  private notionProvider: NotionProvider | null = null

  constructor(config: AIProviderConfig & { databaseId?: string }) {
    super(config)
    
    // OpenAIプロバイダーを初期化
    this.openaiProvider = new OpenAIProvider({
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    })

    // Notion APIが利用可能な場合、NotionProviderを初期化
    if (process.env.NOTION_API_KEY) {
      this.notionProvider = new NotionProvider({
        apiKey: process.env.NOTION_API_KEY,
        databaseId: config.databaseId,
      })
    }
  }

  async chatCompletion(
    messages: AIMessage[],
    tools?: AITool[],
    toolChoice: 'auto' | 'none' | { type: 'function'; function: { name: string } } = 'auto'
  ): Promise<AICompletionResponse> {
    // OpenAIを使用してチャット補完を実行
    const completion = await this.openaiProvider.chatCompletion(messages, tools, toolChoice)

    // Notion関連のツール呼び出しがある場合、Notion APIと連携
    if (completion.toolCalls && this.notionProvider) {
      // Notion関連のツール呼び出しを処理
      // 実際の処理はexecute/route.tsで行われる
    }

    return completion
  }

  getName(): string {
    return 'Hybrid (OpenAI + Notion)'
  }

  isAvailable(): boolean {
    return this.openaiProvider.isAvailable() && (this.notionProvider?.isAvailable() ?? false)
  }

  /**
   * NotionProviderへのアクセス
   */
  getNotionProvider(): NotionProvider | null {
    return this.notionProvider
  }
}

