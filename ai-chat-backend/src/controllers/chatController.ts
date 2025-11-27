import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { getJson } from 'serpapi';

import getLLMProvider from '../services/llm';
import dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const llmProvider = getLLMProvider();
const TOKEN_BUDGET = parseInt(process.env.TOKEN_BUDGET || '4000', 10); // Example token budget

type LLMRole = 'user' | 'assistant' | 'system';
type LLMMessage = { role: LLMRole; content: string };

interface SerpAPIOrganicResult {
  title: string;
  link: string;
  snippet: string;
}

// Helper to decide if a search is needed
function shouldUseSearch(message: string): boolean {
  const searchKeywords = ['who is', 'what is', 'where is', 'location of', 'search for', 'get', 'find'];
  const lowerCaseMessage = message.toLowerCase();
  return searchKeywords.some(keyword => lowerCaseMessage.includes(keyword));
}

// Add a function to perform a web search using SerpApi
const webSearch = async (query: string) => {
  // Make sure to add your SERPAPI_API_KEY to your .env file
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error('SERPAPI_API_KEY is not defined. Please add it to your .env file.');
    return null;
  }

  try {
    const response = await getJson({
      engine: 'google',
      q: query,
      api_key: apiKey,
    });
    return response.organic_results;
  } catch (error) {
    console.error('Error during web search:', error);
    return null;
  }
};

function normalizeRole(role: unknown): LLMRole {
  const r = String(role ?? 'user').toLowerCase();
  if (r === 'assistant') return 'assistant';
  if (r === 'system') return 'system';
  return 'user';
}

function normalizeMessages(input: Array<{ role?: unknown; content?: any }> | undefined): LLMMessage[] {
  if (!Array.isArray(input)) return [];
  return input.map(m => {
    const role = normalizeRole(m.role);
    const content = typeof m?.content === 'string' ? m.content : JSON.stringify(m?.content ?? '');
    return { role, content };
  });
}

// Safely extract text from provider response (handles multiple shapes)
async function extractTextFromResponse(resp: any): Promise<string> {
  if (!resp) return '';

  // If string-like return as-is
  if (typeof resp === 'string') return resp;

  // Non-streaming typical: { choices: [ { message: { content: '...' } } ] } or { choices: [ { text: '...' } ] }
  if ('choices' in resp && Array.isArray(resp.choices) && resp.choices.length > 0) {
    const first = resp.choices[0];
    const msgContent =
      first?.message?.content ??
      (Array.isArray(first?.message?.content?.parts) ? first.message.content.parts.join('') : undefined) ??
      first?.text ??
      '';
    if (typeof msgContent === 'string') return msgContent;
  }

  // Fallback to top-level text or message.content
  if (typeof resp.text === 'string') return resp.text;
  if (resp?.message?.content) {
    const mc = resp.message.content;
    if (typeof mc === 'string') return mc;
    if (Array.isArray(mc)) return mc.join('');
  }

  // If resp is an async iterable (stream), accumulate it
  if (typeof (resp as any)[Symbol.asyncIterator] === 'function') {
    let collected = '';
    try {
      for await (const chunk of resp as AsyncIterable<any>) {
        // Try common chunk shapes
        if (Array.isArray(chunk?.choices)) {
          for (const c of chunk.choices) {
            if (c?.delta?.content) {
              collected += typeof c.delta.content === 'string' ? c.delta.content : (Array.isArray(c.delta.content) ? c.delta.content.join('') : '');
            } else if (typeof c.text === 'string') {
              collected += c.text;
            }
          }
        }
        if (typeof chunk?.text === 'string') collected += chunk.text;
        if (chunk?.message?.content) {
          const mc = chunk.message.content;
          if (typeof mc === 'string') collected += mc;
          else if (Array.isArray(mc)) collected += mc.join('');
        }
      }
    } catch (err) {
      console.error('Error reading streamed response in extractTextFromResponse:', err);
    }
    return collected;
  }

  // As last resort stringify object
  try {
    return JSON.stringify(resp);
  } catch {
    return '';
  }
}

export const sendChatMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId, message, stream } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  let currentConversation: Types.ObjectId;
  let conversationTitle = String(message).substring(0, 50); // Default title from first message

  try {
    // 1. Find or create conversation
    if (conversationId && Types.ObjectId.isValid(conversationId)) {
      const existingConversation = await Conversation.findById(conversationId);
      if (!existingConversation || !existingConversation.userId.equals(userId)) {
        return res.status(404).json({ message: 'Conversation not found or not authorized' });
      }
      currentConversation = existingConversation._id;
      conversationTitle = existingConversation.title; // Keep existing title
    } else {
      const providerModel = (llmProvider as any)?.chatModel ?? (process.env.DEFAULT_CHAT_MODEL ?? 'unknown-model');
      const newConversation = await Conversation.create({
        userId: userId,
        title: conversationTitle,
        model: providerModel,
      });
      currentConversation = newConversation._id;
    }

    // Save user message
    await Message.create({
      conversationId: currentConversation,
      sender: 'user',
      text: message,
      status: 'sent',
    });

    // 2. Retrieve conversation context (previous messages)
    const conversationHistory = await Message.find({ conversationId: currentConversation })
      .sort({ createdAt: 1 })
      .limit(10); // Limit to last 10 messages for context

    const formattedHistory = conversationHistory.map(msg => ({
      role: normalizeRole(msg.sender),
      content: String(msg.text ?? ''),
    })) as LLMMessage[];

    // 3. Decide if a web search is needed
    let searchResults: SerpAPIOrganicResult[] = [];
    if (shouldUseSearch(message)) {
      const webResults = await webSearch(message);
      if (webResults) {
        searchResults = webResults.map((r: SerpAPIOrganicResult) => ({ title: r.title, link: r.link, snippet: r.snippet }));
      }
    }

    // 4. Compose system prompt with history and search results
    const historyText = formattedHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    const searchResultsText = searchResults.length > 0
      ? `\n\nHere are some search results that might be relevant:\n${JSON.stringify(searchResults, null, 2)}`
      : '';

    const systemPrompt = `You are an AI customer support assistant. Answer the user's questions based on the provided conversation history and any relevant search results.

Conversation History:
${historyText}
${searchResultsText}

User Query: ${message}
`;

    // 5. Call LLM provider
    const llmMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: String(message) },
    ];

    if (stream) {
      const completionStream = await llmProvider.generateChatCompletion(llmMessages, true);

      if (!completionStream || typeof (completionStream as any)[Symbol.asyncIterator] !== 'function') {
        const fallbackResp = await llmProvider.generateChatCompletion(llmMessages, false);
        const text = await extractTextFromResponse(fallbackResp);
        const assistantMessage = await Message.create({
          conversationId: currentConversation,
          sender: 'assistant',
          text,
          status: 'received',
        });
        return res.status(200).json({ conversationId: currentConversation, response: text, messageId: assistantMessage._id });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });

      let fullResponseContent = '';
      try {
        for await (const chunk of completionStream as AsyncIterable<any>) {
          let piece = '';

          if (Array.isArray(chunk?.choices)) {
            for (const c of chunk.choices) {
              if (c?.delta?.content) {
                piece += typeof c.delta.content === 'string' ? c.delta.content : (Array.isArray(c.delta.content) ? c.delta.content.join('') : '');
              } else if (typeof c.text === 'string') {
                piece += c.text;
              }
            }
          }

          if (typeof chunk?.text === 'string') piece += chunk.text;
          if (chunk?.message?.content) {
            const mc = chunk.message.content;
            if (typeof mc === 'string') piece += mc;
            else if (Array.isArray(mc)) piece += mc.join('');
          }

          if (piece.length) {
            fullResponseContent += piece;
            res.write(`data: ${JSON.stringify({ content: piece, conversationId: currentConversation })}\n\n`);
          }
        }
      } catch (err) {
        console.error('Streaming error in sendChatMessage:', err);
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Stream error' })}\n\n`);
      } finally {
        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
      }

      await Message.create({
        conversationId: currentConversation,
        sender: 'assistant',
        text: fullResponseContent,
        status: 'received',
      });

      return;
    }

    // Non-streaming flow
    const llmResponse = await llmProvider.generateChatCompletion(llmMessages, false);
    const llmText = await extractTextFromResponse(llmResponse);

    const assistantMessage = await Message.create({
      conversationId: currentConversation,
      sender: 'assistant',
      text: llmText,
      status: 'received',
    });

    res.status(200).json({
      conversationId: currentConversation,
      response: llmText,
      messageId: assistantMessage._id,
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ message: 'Server error during chat message processing' });
  }
};

// Helper function to format conversation for frontend
async function formatConversationForFrontend(conv: any, userId: Types.ObjectId) {
  const lastMessageDoc = await Message.findOne({ conversationId: conv._id }).sort({ createdAt: -1 });
  const messageCount = await Message.countDocuments({ conversationId: conv._id });

  return {
    id: conv._id.toString(),
    title: conv.title,
    lastMessage: lastMessageDoc ? lastMessageDoc.text : 'No messages yet',
    timestamp: conv.updatedAt.toISOString(), // Use updatedAt for timestamp
    messageCount: messageCount,
  };
}

export const getChatHistory = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?._id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const conversationsQuery = Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const [conversations, totalConversations] = await Promise.all([
      conversationsQuery.exec(),
      Conversation.countDocuments({ userId }),
    ]);

    const formattedConversations = await Promise.all(
      conversations.map(conv => formatConversationForFrontend(conv, userId))
    );

    res.status(200).json({
      conversations: formattedConversations,
      currentPage: page,
      totalPages: Math.ceil(totalConversations / limit),
      totalConversations,
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getConversationMessages = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params; // conversationId
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or not authorized' });
    }

    const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });

    res.status(200).json({
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        llmModel: conversation.llmModel, // Include llmModel if exists
        timestamp: conversation.updatedAt ? conversation.updatedAt.toISOString() : new Date().toISOString(),
      },
      messages,
    });
  } catch (error) {
    console.error(`Error fetching messages for conversation ${id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params; // conversationId
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid conversation ID' });
  }

  try {
    const deletedConversation = await Conversation.findOneAndDelete({ _id: id, userId });

    if (!deletedConversation) {
      return res.status(404).json({ message: 'Conversation not found or not authorized' });
    }

    // Optionally, delete all messages associated with this conversation
    await Message.deleteMany({ conversationId: id });

    res.status(200).json({ message: 'Conversation and associated messages deleted successfully' });
  } catch (error) {
    console.error(`Error deleting conversation ${id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};
