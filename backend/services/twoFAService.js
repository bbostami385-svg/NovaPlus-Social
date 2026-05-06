import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateAndStoreOTP, verifyOTP } from './otpService.js';

/**
 * 2FA Service
 * Handles two-factor authentication with OTP and Google Authenticator
 */

/**
 * Generate Google Authenticator secret
 * @param {string} email - User email
 * @param {string} appName - Application name
 * @returns {object} - Secret and QR code
 */
export const generateGoogleAuthenticatorSecret = async (email, appName = 'NovaPlus Social') => {
  try {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${email})`,
      issuer: appName,
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes: generateBackupCodes(10),
    };
  } catch (error) {
    console.error(`Failed to generate Google Authenticator secret: ${error.message}`);
    throw new Error(`Secret generation failed: ${error.message}`);
  }
};

/**
 * Verify Google Authenticator token
 * @param {string} secret - User's secret
 * @param {string} token - 6-digit token from authenticator app
 * @returns {boolean} - True if token is valid
 */
export const verifyGoogleAuthenticatorToken = (secret, token) => {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (30 seconds each)
    });

    return verified;
  } catch (error) {
    console.error(`Failed to verify Google Authenticator token: ${error.message}`);
    return false;
  }
};

/**
 * Generate backup codes for 2FA
 * @param {number} count - Number of codes to generate
 * @returns {array} - Array of backup codes
 */
export const generateBackupCodes = (count = 10) => {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
};

/**
 * Hash backup code
 * @param {string} code - Backup code
 * @returns {string} - Hashed code
 */
export const hashBackupCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Enable 2FA with OTP for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} - OTP and setup data
 */
export const enable2FAOTP = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Generate OTP
    const otp = await generateAndStoreOTP(user.email, '2fa_setup');

    return {
      method: 'otp',
      email: user.email,
      message: 'OTP has been sent to your email',
    };
  } catch (error) {
    console.error(`Failed to enable 2FA OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Enable 2FA with Google Authenticator
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Secret and QR code
 */
export const enable2FAGoogleAuthenticator = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const { secret, qrCode, backupCodes } = await generateGoogleAuthenticatorSecret(user.email);

    // Store temporary secret (not yet confirmed)
    user.twoFATemp = {
      method: 'google_authenticator',
      secret,
      backupCodes: backupCodes.map(code => ({ code: hashBackupCode(code), used: false })),
      createdAt: new Date(),
    };

    await user.save();

    return {
      method: 'google_authenticator',
      secret,
      qrCode,
      backupCodes,
      message: 'Scan the QR code with your authenticator app',
    };
  } catch (error) {
    console.error(`Failed to enable 2FA Google Authenticator: ${error.message}`);
    throw error;
  }
};

/**
 * Verify and confirm 2FA setup
 * @param {string} userId - User ID
 * @param {string} token - Verification token (OTP or GA token)
 * @returns {Promise<void>}
 */
export const confirm2FASetup = async (userId, token) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.twoFATemp) {
      throw new Error('No pending 2FA setup');
    }

    const { method, secret } = user.twoFATemp;

    let isValid = false;

    if (method === 'otp') {
      isValid = await verifyOTP(user.email, token, '2fa_setup');
    } else if (method === 'google_authenticator') {
      isValid = verifyGoogleAuthenticatorToken(secret, token);
    }

    if (!isValid) {
      throw new Error('Invalid verification token');
    }

    // Confirm 2FA
    user.twoFA = {
      enabled: true,
      method,
      secret: method === 'google_authenticator' ? secret : null,
      backupCodes: user.twoFATemp.backupCodes || [],
      enabledAt: new Date(),
    };

    // Clear temporary setup
    user.twoFATemp = null;

    await user.save();

    console.log(`2FA confirmed for user ${userId} (method: ${method})`);
  } catch (error) {
    console.error(`Failed to confirm 2FA setup: ${error.message}`);
    throw error;
  }
};

/**
 * Disable 2FA
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const disable2FA = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.twoFA = {
      enabled: false,
      method: null,
      secret: null,
      backupCodes: [],
    };

    user.twoFATemp = null;

    await user.save();

    console.log(`2FA disabled for user ${userId}`);
  } catch (error) {
    console.error(`Failed to disable 2FA: ${error.message}`);
    throw error;
  }
};

/**
 * Verify 2FA token during login
 * @param {string} userId - User ID
 * @param {string} token - Verification token
 * @returns {Promise<boolean>} - True if token is valid
 */
export const verify2FAToken = async (userId, token) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.twoFA || !user.twoFA.enabled) {
      throw new Error('2FA not enabled for user');
    }

    const { method, secret, backupCodes } = user.twoFA;

    let isValid = false;

    if (method === 'otp') {
      isValid = await verifyOTP(user.email, token, '2fa_login');
    } else if (method === 'google_authenticator') {
      // Check if it's a backup code
      const backupCodeIndex = backupCodes.findIndex(
        bc => !bc.used && hashBackupCode(token) === bc.code
      );

      if (backupCodeIndex !== -1) {
        // Mark backup code as used
        user.twoFA.backupCodes[backupCodeIndex].used = true;
        await user.save();
        isValid = true;
      } else {
        // Verify as GA token
        isValid = verifyGoogleAuthenticatorToken(secret, token);
      }
    }

    return isValid;
  } catch (error) {
    console.error(`Failed to verify 2FA token: ${error.message}`);
    return false;
  }
};

/**
 * Get 2FA status
 * @param {string} userId - User ID
 * @returns {Promise<object>} - 2FA status
 */
export const get2FAStatus = async (userId) => {
  try {
    const user = await User.findById(userId).select('twoFA');

    if (!user) {
      throw new Error('User not found');
    }

    return {
      enabled: user.twoFA?.enabled || false,
      method: user.twoFA?.method || null,
      enabledAt: user.twoFA?.enabledAt || null,
      backupCodesRemaining: user.twoFA?.backupCodes?.filter(bc => !bc.used).length || 0,
    };
  } catch (error) {
    console.error(`Failed to get 2FA status: ${error.message}`);
    throw error;
  }
};

/**
 * Regenerate backup codes
 * @param {string} userId - User ID
 * @returns {Promise<array>} - New backup codes
 */
export const regenerateBackupCodes = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.twoFA || !user.twoFA.enabled) {
      throw new Error('2FA not enabled for user');
    }

    const newBackupCodes = generateBackupCodes(10);

    user.twoFA.backupCodes = newBackupCodes.map(code => ({
      code: hashBackupCode(code),
      used: false,
    }));

    await user.save();

    return newBackupCodes;
  } catch (error) {
    console.error(`Failed to regenerate backup codes: ${error.message}`);
    throw error;
  }
};

export default {
  generateGoogleAuthenticatorSecret,
  verifyGoogleAuthenticatorToken,
  generateBackupCodes,
  hashBackupCode,
  enable2FAOTP,
  enable2FAGoogleAuthenticator,
  confirm2FASetup,
  disable2FA,
  verify2FAToken,
  get2FAStatus,
  regenerateBackupCodes,
};
