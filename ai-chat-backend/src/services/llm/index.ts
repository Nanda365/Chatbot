import { ILLMProvider } from './LLMProvider';
import OpenAIProvider from './OpenAIProvider';
import GeminiProvider from './GeminiProvider';
import dotenv from 'dotenv';

dotenv.config();

const getLLMProvider = (): ILLMProvider => {
  const providerType = process.env.LLM_PROVIDER || 'openai';

  switch (providerType.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider();
    case 'gemini':
      return new GeminiProvider();
    // TODO: Add cases for other providers (anthropic, deepseek, azure_openai)
    default:
      console.warn(`Unsupported LLM_PROVIDER: ${providerType}. Defaulting to OpenAI.`);
      return new OpenAIProvider();
  }
};

export default getLLMProvider;