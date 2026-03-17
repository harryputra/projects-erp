import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  adjustStock,
  getStockDetail,
  getStocks,
} from '../controllers/stock.controller';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requireRole(['Owner', 'Gudang']),
  getStocks
);

router.get(
  '/:productId',
  authMiddleware,
  requireRole(['Owner', 'Gudang']),
  getStockDetail
);

router.patch(
  '/:productId/adjust',
  authMiddleware,
  requireRole(['Owner', 'Gudang']),
  adjustStock
);

export default router;