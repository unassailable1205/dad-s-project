import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromPhone) {
  throw new Error('Twilio credentials are not properly configured');
}

const twilioClient = twilio(accountSid, authToken);

/**
 * Send OTP via SMS using Twilio
 */
export const sendOTPViaSMS = async (
  phoneNumber: string,
  otp: string
): Promise<boolean> => {
  try {
    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${otp}. This code expires in 5 minutes.`,
      from: fromPhone,
      to: phoneNumber,
    });

    console.log(`✅ OTP sent successfully. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP via SMS:', error);
    return false;
  }
};

/**
 * Send password reset OTP via SMS
 */
export const sendPasswordResetOTP = async (
  phoneNumber: string,
  otp: string
): Promise<boolean> => {
  try {
    const message = await twilioClient.messages.create({
      body: `Your password reset code is: ${otp}. This code expires in 5 minutes. Do not share this code.`,
      from: fromPhone,
      to: phoneNumber,
    });

    console.log(`✅ Password reset OTP sent. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset OTP:', error);
    return false;
  }
};

/**
 * Send verification SMS
 */
export const sendVerificationSMS = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: phoneNumber,
    });

    console.log(`✅ Verification SMS sent. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification SMS:', error);
    return false;
  }
};

export default twilioClient;
