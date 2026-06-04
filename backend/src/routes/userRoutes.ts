import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

/**
 * User Routes (Protected - Requires Authentication)
 */

// Get user profile
router.get('/profile', authenticate, userController.getProfile);

// Update user profile
router.put('/profile', authenticate, userController.updateProfile);

// Change password
router.post('/change-password', authenticate, userController.changePassword);

// Delete account
router.delete('/account', authenticate, userController.deleteAccount);

export default router;
