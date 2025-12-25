import OpenAI from 'openai'
import { AIProvider, AIMessage, AITool, AICompletionResponse, AIProviderConfig } from './base'

/**
 * OpenAIプロバイダー実装
 */
export class OpenAIProvider extends AIProvider {
  private client: OpenAI | null = null

  constructor(config: AIProviderConfig) {
    super(config)
    if (this.isAvailable()) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
      })
    }
  }

  async chatCompletion(
    messages: AIMessage[],
    tools?: AITool[],
    toolChoice: 'auto' | 'none' | { type: 'function'; function: { name: string } } = 'auto'
  ): Promise<AICompletionResponse> {
    if (!this.client) {
      throw new Error('OpenAI client is not initialized. Check API key.')
    }

    const completion = await this.client.chat.completions.create({
      model: this.config.model || 'gpt-4-turbo-preview',
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      tools: tools as any,
      tool_choice: toolChoice as any,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens,
    })

    const message = completion.choices[0].message

    return {
      content: message.content || null,
      toolCalls: message.tool_calls?.map((call) => ({
        id: call.id,
        type: call.type as 'function',
        function: {
          name: call.function.name,
          arguments: call.function.arguments,
        },
      })),
    }
  }

  getName(): string {
    return 'OpenAI'
  }

  isAvailable(): boolean {
    return !!this.config.apiKey
  }
}

