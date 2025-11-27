import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, admin access required' });
  }
};

export default requireAdmin;