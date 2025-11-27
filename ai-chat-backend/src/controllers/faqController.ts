import { Request, Response } from 'express';
import FAQ from '../models/FAQ';
import { AuthenticatedRequest } from '../middlewares/authMiddleware'; // Assuming FAQs can be managed by authenticated users

export const createFAQ = async (req: AuthenticatedRequest, res: Response) => {
  const { question, answer, tags } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: 'Question and Answer are required' });
  }

  try {
    const newFAQ = await FAQ.create({
      question,
      answer,
      tags: tags || [],
    });

    res.status(201).json({
      message: 'FAQ created successfully',
      faq: newFAQ,
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFAQs = async (req: Request, res: Response) => {
  try {
    const faqs = await FAQ.find({});
    res.status(200).json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
