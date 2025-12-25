/**
 * AIプロバイダーの抽象化インターフェース
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
    }
  }
}

export interface AIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface AICompletionResponse {
  content: string | null
  toolCalls?: AIToolCall[]
}

export interface AIProviderConfig {
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

/**
 * AIプロバイダーの抽象クラス
 */
export abstract class AIProvider {
  protected config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
  }

  /**
   * チャット補完を実行
   */
  abstract chatCompletion(
    messages: AIMessage[],
    tools?: AITool[],
    toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  ): Promise<AICompletionResponse>

  /**
   * プロバイダー名を取得
   */
  abstract getName(): string

  /**
   * プロバイダーが利用可能かチェック
   */
  abstract isAvailable(): boolean
}

