import { Router } from 'express';
import {
  createMerchant,
  getMerchantDetail,
  getMyMerchants,
} from '../controllers/merchant.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createMerchant);
router.get('/my', authMiddleware, getMyMerchants);
router.get('/:id', authMiddleware, getMerchantDetail);

export default router;