import { Request, Response } from 'express';
import FAQ from '../models/FAQ';
import getLLMProvider from '../services/llm';
import dotenv from 'dotenv';

dotenv.config();

const llmProvider = getLLMProvider();

export const searchDocumentsAndFAQs = async (req: Request, res: Response) => {
  const { q: query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query parameter "q" is required and must be a string.' });
  }

  try {
    // Perform search over FAQs (can be semantic or keyword based)
    // For simplicity, let's do a basic keyword search for FAQs for now
    const faqResults = await FAQ.find({
      $or: [
        { question: { $regex: query, $options: 'i' } },
        { answer: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    });

    // You might want to combine and re-rank these results based on relevance.
    // For this implementation, we return them separately.
    res.status(200).json({
      query,
      faqResults,
    });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
};
