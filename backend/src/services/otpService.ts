import OTP from '../models/OTP';
import { generateOTP } from '../utils/helpers';
import { sendOTPViaSMS, sendPasswordResetOTP } from './twilioService';

/**
 * Create and send OTP
 */
export const createAndSendOTP = async (
  phone: string,
  purpose: 'registration' | 'password_reset' | 'phone_verification' = 'registration'
): Promise<{ success: boolean; message: string; expiresIn: number }> => {
  try {
    // Delete existing OTPs for this phone and purpose
    await OTP.deleteMany({ phone, purpose });

    // Generate OTP
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    const otpDoc = new OTP({
      phone,
      otp,
      purpose,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      isUsed: false,
    });

    await otpDoc.save();

    // Send OTP via SMS
    let smsSent = false;
    if (purpose === 'password_reset') {
      smsSent = await sendPasswordResetOTP(phone, otp);
    } else {
      smsSent = await sendOTPViaSMS(phone, otp);
    }

    if (!smsSent) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return {
        success: false,
        message: 'Failed to send OTP via SMS',
        expiresIn: 0,
      };
    }

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 5 * 60, // 5 minutes in seconds
    };
  } catch (error) {
    console.error('Error creating OTP:', error);
    return {
      success: false,
      message: 'Error creating OTP',
      expiresIn: 0,
    };
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (
  phone: string,
  otp: string,
  purpose: 'registration' | 'password_reset' | 'phone_verification' = 'registration'
): Promise<{ success: boolean; message: string }> => {
  try {
    // Find valid OTP
    const otpDoc = await OTP.findOne({
      phone,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return {
        success: false,
        message: 'OTP not found or has expired',
      };
    }

    // Check max attempts
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return {
        success: false,
        message: 'Maximum OTP verification attempts exceeded',
      };
    }

    // Verify OTP
    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return {
        success: false,
        message: `Invalid OTP. ${otpDoc.maxAttempts - otpDoc.attempts} attempts remaining`,
      };
    }

    // Mark OTP as used
    otpDoc.isUsed = true;
    otpDoc.usedAt = new Date();
    await otpDoc.save();

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Error verifying OTP',
    };
  }
};

/**
 * Check if OTP can be resent (throttle to 30 seconds)
 */
export const canResendOTP = async (
  phone: string,
  purpose: 'registration' | 'password_reset' | 'phone_verification' = 'registration'
): Promise<boolean> => {
  try {
    const lastOTP = await OTP.findOne({ phone, purpose }).sort({ createdAt: -1 });

    if (!lastOTP) {
      return true; // No previous OTP, can send
    }

    const timeDifference = Date.now() - lastOTP.createdAt.getTime();
    const thirtySeconds = 30 * 1000;

    return timeDifference >= thirtySeconds;
  } catch (error) {
    console.error('Error checking OTP resend eligibility:', error);
    return false;
  }
};

/**
 * Clean expired OTPs
 */
export const cleanExpiredOTPs = async (): Promise<void> => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(`🧹 Cleaned ${result.deletedCount} expired OTPs`);
  } catch (error) {
    console.error('Error cleaning expired OTPs:', error);
  }
};
