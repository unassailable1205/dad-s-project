import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import {
  sendOTPSchema,
  verifyOTPSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validationSchemas';
import * as otpService from '../services/otpService';
import * as authService from '../services/authService';

/**
 * Send OTP to phone number
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = await sendOTPSchema.parseAsync(req.body);

  const result = await otpService.createAndSendOTP(phone, 'registration');

  res.status(result.success ? 200 : 400).json({
    success: result.success,
    message: result.message,
    expiresIn: result.expiresIn,
  });
});

/**
 * Verify OTP
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = await verifyOTPSchema.parseAsync(req.body);

  const result = await otpService.verifyOTP(phone, otp, 'registration');

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
    verified: true,
  });
});

/**
 * Register new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const userData = await registerSchema.parseAsync(req.body);

  // Check if user already exists
  const userExists = await authService.usernameExists(userData.username);
  if (userExists) {
    res.status(400).json({
      success: false,
      message: 'Username already exists',
    });
    return;
  }

  const emailExists = await authService.emailExists(userData.email);
  if (emailExists) {
    res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
    return;
  }

  // Register user
  const result = await authService.registerUser({
    ...userData,
    dob: new Date(userData.dob),
  });

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: result.message,
    });
    return;
  }

  // Generate tokens
  const tokenPayload = {
    userId: result.user._id,
    username: result.user.username,
    email: result.user.email,
  };

  const token = require('../utils/jwtUtils').generateAccessToken(tokenPayload);
  const refreshToken = require('../utils/jwtUtils').generateRefreshToken(tokenPayload);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: result.user,
    token,
    refreshToken,
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, rememberMe } = await loginSchema.parseAsync(
    req.body
  );

  const result = await authService.loginUser(username, password);

  if (!result.success) {
    res.status(401).json({
      success: false,
      message: result.message,
    });
    return;
  }

  // Set secure cookies if remember me is checked
  if (rememberMe) {
    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  res.status(200).json({
    success: true,
    message: result.message,
    user: result.user,
    token: result.token,
    refreshToken: result.refreshToken,
  });
});

/**
 * Forgot password - Send OTP
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone } = await forgotPasswordSchema.parseAsync(req.body);

    // Check if user exists
    const user = await require('../models/User').default.findOne({ phone });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found with this phone number',
      });
      return;
    }

    // Send OTP
    const result = await otpService.createAndSendOTP(phone, 'password_reset');

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
      expiresIn: result.expiresIn,
    });
  }
);

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp, newPassword } = await resetPasswordSchema.parseAsync(
    req.body
  );

  // Verify OTP
  const verifyResult = await otpService.verifyOTP(
    phone,
    otp,
    'password_reset'
  );

  if (!verifyResult.success) {
    res.status(400).json({
      success: false,
      message: verifyResult.message,
    });
    return;
  }

  // Reset password
  const result = await authService.resetPassword(phone, newPassword);

  res.status(result.success ? 200 : 400).json({
    success: result.success,
    message: result.message,
  });
});

/**
 * Resend OTP
 */
export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phone, purpose } = req.body;

  // Check if can resend
  const canResend = await otpService.canResendOTP(
    phone,
    purpose || 'registration'
  );

  if (!canResend) {
    res.status(429).json({
      success: false,
      message: 'Please wait before requesting a new OTP',
    });
    return;
  }

  // Send OTP
  const result = await otpService.createAndSendOTP(
    phone,
    purpose || 'registration'
  );

  res.status(result.success ? 200 : 400).json({
    success: result.success,
    message: result.message,
    expiresIn: result.expiresIn,
  });
});

/**
 * Logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
