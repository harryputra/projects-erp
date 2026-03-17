import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  createPurchase,
  getPurchaseDetail,
  getPurchases,
} from '../controllers/purchase.controller';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireRole(['Owner', 'Gudang']),
  createPurchase
);

router.get(
  '/',
  authMiddleware,
  requireRole(['Owner', 'Gudang']),
  getPurchases
);

router.get(
  '/:id',
  authMiddleware,
  requireRole(['Owner', 'Gudang']),
  getPurchaseDetail
);

export default router;