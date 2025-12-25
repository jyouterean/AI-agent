import { AIProvider, AIProviderConfig } from './providers/base'
import { OpenAIProvider } from './providers/openai'
import { NotionProvider } from './providers/notion'
import { HybridProvider } from './providers/hybrid'

export type ProviderType = 'openai' | 'notion' | 'hybrid'

/**
 * AIプロバイダーファクトリー
 */
export class AIProviderFactory {
  /**
   * プロバイダーを作成
   */
  static createProvider(
    type: ProviderType,
    config: AIProviderConfig & { databaseId?: string }
  ): AIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config)
      case 'notion':
        return new NotionProvider(config)
      case 'hybrid':
        // ハイブリッドモード: OpenAI + Notion API
        return new HybridProvider({
          ...config,
          apiKey: config.apiKey || process.env.OPENAI_API_KEY,
        })
      default:
        throw new Error(`Unknown provider type: ${type}`)
    }
  }

  /**
   * 利用可能なプロバイダーを取得
   */
  static getAvailableProviders(): ProviderType[] {
    const providers: ProviderType[] = []

    if (process.env.OPENAI_API_KEY) {
      providers.push('openai')
    }

    if (process.env.NOTION_API_KEY) {
      providers.push('notion')
    }

    if (process.env.OPENAI_API_KEY && process.env.NOTION_API_KEY) {
      providers.push('hybrid')
    }

    return providers
  }

  /**
   * デフォルトプロバイダーを取得
   */
  static getDefaultProvider(): ProviderType {
    const available = this.getAvailableProviders()
    if (available.includes('hybrid')) {
      return 'hybrid'
    }
    if (available.includes('openai')) {
      return 'openai'
    }
    if (available.includes('notion')) {
      return 'notion'
    }
    return 'openai' // フォールバック
  }
}

