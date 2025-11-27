import { Router } from 'express';
import { createFAQ, getFAQs } from '../controllers/faqController';
import authMiddleware from '../middlewares/authMiddleware';
import requireAdmin from '../middlewares/requireAdmin';

const router = Router();

// Admin only route for creating FAQs
router.post('/', authMiddleware, requireAdmin, createFAQ); // POST /api/faqs

// Public route for getting FAQs
router.get('/', getFAQs); // GET /api/faqs

export default router;