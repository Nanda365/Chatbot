import OpenAI from 'openai';
import { ILLMProvider } from './LLMProvider';
import dotenv from 'dotenv';

dotenv.config();

class OpenAIProvider implements ILLMProvider {
  private openai: OpenAI;
  private embeddingModel: string;
  private chatModel: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables.');
    }
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.embeddingModel = 'text-embedding-ada-002'; // Default embedding model
    this.chatModel = 'gpt-3.5-turbo'; // Default chat model
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating OpenAI embedding:', error);
      throw error;
    }
  }

  // Helper: safely extract content from non-stream or streamed responses
  private async extractChatContent(response: any): Promise<string | null> {
    // Non-streaming: has 'choices' array
    if (response && 'choices' in response && Array.isArray(response.choices)) {
      const first = response.choices[0];
      // Different SDK shapes: try message.content, text, or join parts
      const messageContent =
        first?.message?.content ??
        (first?.message?.content?.parts ? first.message.content.parts.join('') : undefined) ??
        first?.text ??
        null;
      return (typeof messageContent === 'string' ? messageContent : null);
    }

    // Streaming: response might be an async iterable
    if (response && typeof (response as any)[Symbol.asyncIterator] === 'function') {
      let collected = '';
      try {
        for await (const chunk of response as AsyncIterable<any>) {
          // Try chunk.choices[*].delta.content
          const chunkChoices = (chunk as any).choices;
          if (Array.isArray(chunkChoices)) {
            for (const c of chunkChoices) {
              if (c?.delta) {
                if (typeof c.delta.content === 'string') {
                  collected += c.delta.content;
                } else if (Array.isArray(c.delta.content)) {
                  collected += c.delta.content.join('');
                }
              }
              if (typeof c.text === 'string') {
                collected += c.text;
              }
            }
          }

          // Fallback top-level fields
          if (typeof (chunk as any).text === 'string') {
            collected += (chunk as any).text;
          }
          if ((chunk as any).message?.content) {
            const mc = (chunk as any).message.content;
            if (typeof mc === 'string') collected += mc;
            else if (Array.isArray(mc)) collected += mc.join('');
          }
        }
      } catch (err) {
        console.error('Error while reading streamed response:', err);
      }
      return collected.length ? collected : null;
    }

    // Last-resort fallbacks
    if (response?.message?.content) {
      const mc = response.message.content;
      if (typeof mc === 'string') return mc;
      if (Array.isArray(mc)) return mc.join('');
    }
    if (typeof response?.text === 'string') return response.text;

    return null;
  }

  /**
   * Generate chat completion.
   * - If stream = true, returns the stream object (async iterable) so caller can consume it.
   * - If stream = false, returns the resulting text (string) or null if none.
   */
  async generateChatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    stream: boolean = false,
  ): Promise<string | AsyncIterable<any> | null> {
    try {
      // Ask OpenAI for completion. Cast options/response to `any` for flexibility.
      const response: any = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages,
        stream,
      });

      if (stream) {
        // Return the stream (async iterable) directly for the caller to consume
        return response as AsyncIterable<any>;
      } else {
        // Safely extract text from the non-streaming shape
        const text = await this.extractChatContent(response);
        return text;
      }
    } catch (error) {
      console.error('Error generating OpenAI chat completion:', error);
      throw error;
    }
  }
}

export default OpenAIProvider;
