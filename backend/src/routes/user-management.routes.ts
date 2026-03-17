import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  createMerchantUser,
  deactivateMerchantUser,
  getMerchantUsers,
  updateMerchantUserRole,
} from '../controllers/user-management.controller';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireRole(['Owner']),
  createMerchantUser
);

router.get(
  '/',
  authMiddleware,
  requireRole(['Owner']),
  getMerchantUsers
);

router.patch(
  '/:id/role',
  authMiddleware,
  requireRole(['Owner']),
  updateMerchantUserRole
);

router.patch(
  '/:id/deactivate',
  authMiddleware,
  requireRole(['Owner']),
  deactivateMerchantUser
);

export default router;