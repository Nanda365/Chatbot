export interface ILLMProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateChatCompletion(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, stream?: boolean): Promise<any>;
  // Potentially add more methods for different LLM functionalities
}
