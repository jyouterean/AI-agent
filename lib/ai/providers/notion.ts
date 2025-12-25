import { Client } from '@notionhq/client'
import { AIProvider, AIMessage, AITool, AICompletionResponse, AIProviderConfig } from './base'

/**
 * Notion API統合プロバイダー
 * Note: Notion AIは直接API経由でアクセスできないため、
 * Notion APIを使用してデータベースやページと連携します
 */
export class NotionProvider extends AIProvider {
  private notion: Client | null = null
  private databaseId: string | null = null

  constructor(config: AIProviderConfig & { databaseId?: string }) {
    super(config)
    if (this.isAvailable()) {
      this.notion = new Client({
        auth: config.apiKey,
      })
      this.databaseId = config.databaseId || null
    }
  }

  async chatCompletion(
    messages: AIMessage[],
    tools?: AITool[],
    toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  ): Promise<AICompletionResponse> {
    // Notion AIは直接API経由でアクセスできないため、
    // OpenAIなどの他のプロバイダーと組み合わせて使用する
    // この実装では、Notion APIを使用してデータを保存・取得する機能を提供
    
    const lastMessage = messages[messages.length - 1]
    
    // Notionモードでは、ツール呼び出しをサポート
    // 実際のAI処理はOpenAIと組み合わせて使用することを推奨
    const content = `Notion API統合モード: "${lastMessage.content}" を受け取りました。
    
利用可能な機能:
- save_to_notion: Notionデータベースに情報を保存
- search_notion: Notionデータベースから情報を検索

Notion APIはデータの保存・検索に特化しています。より高度なAI機能を使用する場合は、Hybridモード（OpenAI + Notion）の使用を推奨します。`
    
    return {
      content,
      toolCalls: [],
    }
  }

  getName(): string {
    return 'Notion API'
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && !!this.notion
  }

  /**
   * Notionデータベースにページを作成
   */
  async createPage(databaseId: string, properties: Record<string, any>) {
    if (!this.notion) {
      throw new Error('Notion client is not initialized')
    }

    return await this.notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    })
  }

  /**
   * Notionデータベースからページを検索
   */
  async queryDatabase(databaseId: string, filter?: any) {
    if (!this.notion) {
      throw new Error('Notion client is not initialized')
    }

    // Notion APIの型定義の問題を回避するため、anyを使用
    return await (this.notion as any).databases.query({
      database_id: databaseId,
      filter,
    })
  }

  /**
   * Notionページを更新
   */
  async updatePage(pageId: string, properties: Record<string, any>) {
    if (!this.notion) {
      throw new Error('Notion client is not initialized')
    }

    return await this.notion.pages.update({
      page_id: pageId,
      properties,
    })
  }

  /**
   * Notionページの内容を取得
   */
  async getPage(pageId: string) {
    if (!this.notion) {
      throw new Error('Notion client is not initialized')
    }

    return await this.notion.pages.retrieve({ page_id: pageId })
  }

  /**
   * Notionページをアーカイブ（削除）
   */
  async archivePage(pageId: string) {
    if (!this.notion) {
      throw new Error('Notion client is not initialized')
    }

    return await this.notion.pages.update({
      page_id: pageId,
      archived: true,
    })
  }
}

