import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { updateProfileSchema } from '../utils/validationSchemas';
import * as authService from '../services/authService';

/**
 * Get user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const user = await authService.getUserById(req.user.userId);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const updates = await updateProfileSchema.parseAsync(req.body);

  const result = await authService.updateUserProfile(req.user.userId, updates);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: result.message,
    user: result.user,
  });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'All password fields are required',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
      return;
    }

    // Get user with password
    const User = require('../models/User').default;
    const user = await User.findById(req.user.userId).select('+passwordHash');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const { comparePasswords } = require('../utils/helpers');
    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    const result = await authService.resetPassword(user.phone, newPassword);

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
    });
  }
);

/**
 * Delete user account
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const { password } = req.body;

  if (!password) {
    res.status(400).json({
      success: false,
      message: 'Password is required to delete account',
    });
    return;
  }

  // Get user with password
  const User = require('../models/User').default;
  const user = await User.findById(req.user.userId).select('+passwordHash');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  // Verify password
  const { comparePasswords } = require('../utils/helpers');
  const isPasswordValid = await comparePasswords(password, user.passwordHash);

  if (!isPasswordValid) {
    res.status(400).json({
      success: false,
      message: 'Incorrect password',
    });
    return;
  }

  // Delete user
  try {
    await User.findByIdAndDelete(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting account',
    });
  }
});
