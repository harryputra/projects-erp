import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  createSale,
  getSaleDetail,
  getSales,
} from '../controllers/sale.controller';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireRole(['Owner', 'Kasir']),
  createSale
);

router.get(
  '/',
  authMiddleware,
  requireRole(['Owner', 'Kasir']),
  getSales
);

router.get(
  '/:id',
  authMiddleware,
  requireRole(['Owner', 'Kasir']),
  getSaleDetail
);

export default router;