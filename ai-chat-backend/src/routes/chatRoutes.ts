import { Router } from 'express';
import { sendChatMessage, getChatHistory, getConversationMessages } from '../controllers/chatController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.post('/send', authMiddleware, sendChatMessage); // POST /api/chat/send
router.get('/history', authMiddleware, getChatHistory); // GET /api/chat/history (paginated)
router.get('/history/:id', authMiddleware, getConversationMessages); // GET /api/chat/history/:id

export default router;