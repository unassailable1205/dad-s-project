import User from '../models/User';
import { hashPassword, comparePasswords } from '../utils/helpers';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils';

/**
 * Register new user
 */
export const registerUser = async (userData: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  occupation: string;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  city: string;
  state: string;
  country: string;
  profilePicture?: string;
}): Promise<{ success: boolean; user?: any; message: string }> => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username },
        { phone: userData.phone },
      ],
    });

    if (existingUser) {
      return {
        success: false,
        message: 'User already exists with this email, username, or phone',
      };
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create new user
    const newUser = new User({
      ...userData,
      passwordHash,
      isPhoneVerified: true, // Since phone was verified via OTP
      isVerified: false,
    });

    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    return {
      success: true,
      user: userResponse,
      message: 'User registered successfully',
    };
  } catch (error: any) {
    console.error('Error registering user:', error);
    return {
      success: false,
      message: error.message || 'Error registering user',
    };
  }
};

/**
 * Login user
 */
export const loginUser = async (
  username: string,
  password: string
): Promise<{ success: boolean; user?: any; token?: string; refreshToken?: string; message: string }> => {
  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    }).select('+passwordHash');

    if (!user) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    // Compare passwords
    const isPasswordValid = await comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    return {
      success: true,
      user: userResponse,
      token: accessToken,
      refreshToken,
      message: 'Login successful',
    };
  } catch (error: any) {
    console.error('Error logging in user:', error);
    return {
      success: false,
      message: error.message || 'Error logging in',
    };
  }
};

/**
 * Reset password
 */
export const resetPassword = async (
  phone: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Find user by phone
    const user = await User.findOne({ phone });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    user.passwordHash = passwordHash;
    await user.save();

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: error.message || 'Error resetting password',
    };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<any | null> => {
  try {
    const user = await User.findById(userId);
    if (user) {
      const userResponse = user.toObject();
      delete userResponse.passwordHash;
      return userResponse;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<any>
): Promise<{ success: boolean; user?: any; message: string }> => {
  try {
    // Don't allow updating password through this endpoint
    delete updates.passwordHash;
    delete updates.password;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    return {
      success: true,
      user: userResponse,
      message: 'Profile updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      message: error.message || 'Error updating profile',
    };
  }
};

/**
 * Check if username exists
 */
export const usernameExists = async (username: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    return !!user;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};

/**
 * Check if email exists
 */
export const emailExists = async (email: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};
