import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middlewares/validate';
import {
  sendOTPSchema,
  verifyOTPSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validationSchemas';

const router = Router();

/**
 * Authentication Routes
 */

// Send OTP
router.post('/send-otp', validate(sendOTPSchema), authController.sendOTP);

// Verify OTP
router.post('/verify-otp', validate(verifyOTPSchema), authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', authController.resendOTP);

// Register
router.post('/register', validate(registerSchema), authController.register);

// Login
router.post('/login', validate(loginSchema), authController.login);

// Forgot Password
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset Password
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Logout
router.post('/logout', authController.logout);

export default router;
