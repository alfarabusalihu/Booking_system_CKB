import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { log, err } from '../utils/logger.js';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter with SMTP configuration
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error('Email configuration missing. Set EMAIL_USER and EMAIL_PASSWORD in .env');
  }

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  log('EMAIL', 'Email transporter initialized');
  return transporter;
}

/**
 * Send email verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  fullName: string,
  verificationToken: string
): Promise<void> {
  try {
    const transport = getTransporter();
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const emailFrom = process.env.EMAIL_FROM || 'Train Booking System <noreply@trainbooking.com>';

    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Verify Your Email - Train Booking System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Welcome to Train Booking System!</h1>
            <p style="font-size: 16px;">Hi ${fullName},</p>
            <p style="font-size: 16px;">Thank you for registering with Train Booking System. To complete your registration and start booking train tickets, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 14px; word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="font-size: 13px; color: #666; margin-bottom: 5px;">
                <strong>Important:</strong> This verification link will expire in 24 hours.
              </p>
              <p style="font-size: 13px; color: #666;">
                If you didn't create an account with Train Booking System, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #999;">
            <p>&copy; ${new Date().getFullYear()} Train Booking System. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Train Booking System!

Hi ${fullName},

Thank you for registering with Train Booking System. To complete your registration and start booking train tickets, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Train Booking System, please ignore this email.

© ${new Date().getFullYear()} Train Booking System. All rights reserved.
      `.trim(),
    };

    await transport.sendMail(mailOptions);
    log('EMAIL', `Verification email sent to ${email}`);
  } catch (error) {
    err('EMAIL', `Failed to send verification email to ${email}`, error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string
): Promise<void> {
  try {
    const transport = getTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const emailFrom = process.env.EMAIL_FROM || 'Train Booking System <noreply@trainbooking.com>';

    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Password Reset Request - Train Booking System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin-top: 0;">Password Reset Request</h1>
            <p style="font-size: 16px;">Hi ${fullName},</p>
            <p style="font-size: 16px;">We received a request to reset your password for your Train Booking System account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 14px; word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="font-size: 13px; color: #666; margin-bottom: 5px;">
                <strong>Important:</strong> This password reset link will expire in 1 hour.
              </p>
              <p style="font-size: 13px; color: #666;">
                If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #999;">
            <p>&copy; ${new Date().getFullYear()} Train Booking System. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Hi ${fullName},

We received a request to reset your password for your Train Booking System account.

Click the link below to reset your password:

${resetUrl}

This password reset link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

© ${new Date().getFullYear()} Train Booking System. All rights reserved.
      `.trim(),
    };

    await transport.sendMail(mailOptions);
    log('EMAIL', `Password reset email sent to ${email}`);
  } catch (error) {
    err('EMAIL', `Failed to send password reset email to ${email}`, error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Test email configuration
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    log('EMAIL', 'Email configuration is valid');
    return true;
  } catch (error) {
    err('EMAIL', 'Email configuration test failed', error);
    return false;
  }
}
