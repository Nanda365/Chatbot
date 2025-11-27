import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMProvider } from './LLMProvider';
import dotenv from 'dotenv';

dotenv.config();

export default class GeminiProvider implements ILLMProvider {
  private genAI: GoogleGenerativeAI;
  private chatModel: string;
  private embeddingModel: string;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.chatModel = 'gemini-2.0-flash-001'; // Default Gemini chat model
    this.embeddingModel = 'embedding-001'; // Default Gemini embedding model


  }


  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.embeddingModel }, { apiVersion: 'v1alpha' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating Gemini embedding:', error);
      throw error;
    }
  }

  async generateChatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    stream?: boolean,
  ): Promise<any> { // Promise<any> to match ILLMProvider more broadly
    stream = stream ?? false; // Handle default value inside function
    try {
      const model = this.genAI.getGenerativeModel({ model: this.chatModel }, { apiVersion: 'v1alpha' });

      // Gemini's API expects 'user' and 'model' roles, not 'assistant' or 'system'
      const geminiMessages = messages.map(msg => {
        if (msg.role === 'system') {
          // System messages are a bit tricky with Gemini's API.
          // For now, prepend system messages to the first user message or ignore.
          // A more robust solution might involve sending them as an initial user message.
          return { role: 'user', parts: [{ text: `(System message: ${msg.content})` }] };
        }
        return {
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }],
        };
      });

      const chat = model.startChat({
        history: geminiMessages.slice(0, -1), // History is all but the last message
        generationConfig: {
          maxOutputTokens: 2048,
        },
      });

      const lastMessage = geminiMessages[geminiMessages.length - 1].parts[0].text;

      if (stream) {
        const result = await chat.sendMessageStream(lastMessage);
        return result.stream; // Return the async iterable
      } else {
        const result = await chat.sendMessage(lastMessage);
        const response = result.response;
        return response.text();
      }
    } catch (error) {
      console.error('Error generating Gemini chat completion:', error);
      throw error;
    }
  }
}