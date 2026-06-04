import { z } from 'zod';

// Common validation schemas
export const phoneValidation = z
  .string()
  .regex(/^\+?1?\d{9,15}$/, 'Invalid phone number format');

export const emailValidation = z
  .string()
  .email('Invalid email format')
  .toLowerCase();

export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const usernameValidation = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores');

// Auth validation schemas
export const sendOTPSchema = z.object({
  phone: phoneValidation,
});

export const verifyOTPSchema = z.object({
  phone: phoneValidation,
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  username: usernameValidation,
  email: emailValidation,
  phone: phoneValidation,
  password: passwordValidation,
  confirmPassword: z.string(),
  occupation: z
    .string()
    .min(2, 'Occupation must be at least 2 characters')
    .max(50, 'Occupation cannot exceed 50 characters'),
  dob: z
    .string()
    .refine((date) => {
      const birthDate = new Date(date);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 120;
    }, 'You must be at least 13 years old'),
  gender: z.enum(['male', 'female', 'other']),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters'),
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State cannot exceed 50 characters'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country cannot exceed 50 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  phone: phoneValidation,
});

export const resetPasswordSchema = z.object({
  phone: phoneValidation,
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
  newPassword: passwordValidation,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .optional(),
  email: emailValidation.optional(),
  occupation: z
    .string()
    .min(2, 'Occupation must be at least 2 characters')
    .max(50, 'Occupation cannot exceed 50 characters')
    .optional(),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters')
    .optional(),
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State cannot exceed 50 characters')
    .optional(),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country cannot exceed 50 characters')
    .optional(),
}).strict();

// Types exported from schemas
export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
