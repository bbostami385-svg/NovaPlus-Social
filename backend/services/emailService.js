import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@novaplus.com';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Initialize SendGrid if API key exists
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Initialize Nodemailer as fallback
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Email Service
 * Handles email sending with SendGrid or SMTP fallback
 */

/**
 * Send email verification code
 * @param {string} email - Recipient email
 * @param {string} code - Verification code
 * @param {string} userName - User name
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (email, code, userName = '') => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>Thank you for signing up for NovaPlus Social. Please verify your email address using the code below:</p>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #007bff; letter-spacing: 2px; margin: 0;">${code}</h1>
        </div>
        
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">NovaPlus Social Team</p>
      </div>
    `;

    const mailOptions = {
      from: SENDGRID_FROM_EMAIL,
      to: email,
      subject: 'Email Verification - NovaPlus Social',
      html: htmlContent,
    };

    if (SENDGRID_API_KEY) {
      await sgMail.send(mailOptions);
    } else {
      await transporter.sendMail(mailOptions);
    }

    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send verification email: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Reset token
 * @param {string} resetLink - Reset link
 * @param {string} userName - User name
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email, resetToken, resetLink, userName = '') => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
        
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">NovaPlus Social Team</p>
      </div>
    `;

    const mailOptions = {
      from: SENDGRID_FROM_EMAIL,
      to: email,
      subject: 'Password Reset - NovaPlus Social',
      html: htmlContent,
    };

    if (SENDGRID_API_KEY) {
      await sgMail.send(mailOptions);
    } else {
      await transporter.sendMail(mailOptions);
    }

    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send password reset email: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send 2FA code email
 * @param {string} email - Recipient email
 * @param {string} code - 2FA code
 * @param {string} userName - User name
 * @returns {Promise<void>}
 */
export const send2FAEmail = async (email, code, userName = '') => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Two-Factor Authentication</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>Someone is trying to access your NovaPlus Social account. Use this code to complete the login:</p>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #dc3545; letter-spacing: 2px; margin: 0;">${code}</h1>
        </div>
        
        <p>This code will expire in 5 minutes.</p>
        <p>If this wasn't you, please secure your account immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">NovaPlus Social Team</p>
      </div>
    `;

    const mailOptions = {
      from: SENDGRID_FROM_EMAIL,
      to: email,
      subject: 'Your 2FA Code - NovaPlus Social',
      html: htmlContent,
    };

    if (SENDGRID_API_KEY) {
      await sgMail.send(mailOptions);
    } else {
      await transporter.sendMail(mailOptions);
    }

    console.log(`2FA email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send 2FA email: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} userName - User name
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (email, userName = '') => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to NovaPlus Social!</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>Welcome to NovaPlus Social - the platform for connecting, sharing, and creating!</p>
        
        <h3>Get Started:</h3>
        <ul>
          <li>Complete your profile</li>
          <li>Follow interesting creators</li>
          <li>Share your first post</li>
          <li>Join our community</li>
        </ul>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">NovaPlus Social Team</p>
      </div>
    `;

    const mailOptions = {
      from: SENDGRID_FROM_EMAIL,
      to: email,
      subject: 'Welcome to NovaPlus Social!',
      html: htmlContent,
    };

    if (SENDGRID_API_KEY) {
      await sgMail.send(mailOptions);
    } else {
      await transporter.sendMail(mailOptions);
    }

    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  send2FAEmail,
  sendWelcomeEmail,
};
