import { Router } from 'express';
import { searchDocumentsAndFAQs } from '../controllers/searchController';

const router = Router();

router.get('/', searchDocumentsAndFAQs); // GET /api/search?q=...

export default router;