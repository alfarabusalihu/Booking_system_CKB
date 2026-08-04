# Email Verification Setup Guide

This guide explains how to set up and use the email verification system for user registration.

## Features Implemented

✅ Email verification tokens on user registration
✅ Secure token generation with expiration (24 hours)
✅ Email sending via SMTP (Nodemailer)
✅ Verification endpoint
✅ Resend verification email endpoint
✅ User email status tracking (`emailVerified` field)
✅ Beautiful HTML email templates

## Database Schema Changes

The `User` model now includes:
- `emailVerified` (Boolean) - Track if user's email is verified
- `emailVerificationToken` (String, unique) - Secure verification token
- `emailVerificationTokenExpiresAt` (DateTime) - Token expiration time

## API Endpoints

### 1. Register User (POST /api/auth/register)
**Modified to send verification email**

Request:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+94712345678",
  "password": "securePassword123"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+94712345678",
    "emailVerified": false
  }
}
```

**Note**: Verification email is sent automatically. User can still log in but should verify their email.

### 2. Verify Email (POST /api/auth/verify-email)
**New endpoint**

Request:
```json
{
  "token": "verification_token_from_email"
}
```

Response (Success):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "fullName": "John Doe",
    "emailVerified": true
  }
}
```

Response (Error - Invalid Token):
```json
{
  "success": false,
  "error": "Invalid verification token."
}
```

Response (Error - Expired Token):
```json
{
  "success": false,
  "error": "Verification token has expired. Please request a new one."
}
```

Response (Error - Already Verified):
```json
{
  "success": false,
  "error": "Email is already verified."
}
```

### 3. Resend Verification Email (POST /api/auth/resend-verification)
**New endpoint - Requires authentication**

Request: No body required (uses authenticated user)

Response (Success):
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

Response (Error - Already Verified):
```json
{
  "success": false,
  "error": "Email is already verified."
}
```

### 4. Get Current User (GET /api/auth/me)
**Modified to include emailVerified**

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "fullName": "John Doe",
    "emailVerified": true
  }
}
```

## Environment Configuration

Add these variables to your `.env` file:

```env
# Email Configuration (SMTP)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="Train Booking System <noreply@trainbooking.com>"

# Application URL (for email links)
APP_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"
```

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. **Update .env**:
   ```env
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT="587"
   EMAIL_USER="your-gmail@gmail.com"
   EMAIL_PASSWORD="your-16-char-app-password"
   ```

### Other SMTP Providers

**SendGrid**:
```env
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASSWORD="your-sendgrid-api-key"
```

**Mailgun**:
```env
EMAIL_HOST="smtp.mailgun.org"
EMAIL_PORT="587"
EMAIL_USER="your-mailgun-username"
EMAIL_PASSWORD="your-mailgun-password"
```

**AWS SES**:
```env
EMAIL_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_PORT="587"
EMAIL_USER="your-ses-smtp-username"
EMAIL_PASSWORD="your-ses-smtp-password"
```

## Email Templates

The system includes professional HTML email templates with:
- Responsive design
- Branded header and footer
- Clear call-to-action buttons
- Plaintext fallback for email clients that don't support HTML

## Security Features

1. **Secure Token Generation**: Uses Node.js crypto module for random tokens
2. **Token Expiration**: Tokens expire after 24 hours
3. **Unique Tokens**: Database constraint ensures token uniqueness
4. **No Password in Emails**: Only verification links are sent
5. **HTTPS Ready**: Secure cookie settings for production

## Testing Email Service

You can test if your email configuration is working:

```typescript
import { testEmailConnection } from './services/email.service.js';

const isConfigValid = await testEmailConnection();
console.log('Email config valid:', isConfigValid);
```

## Frontend Integration Example

```typescript
// 1. After registration, show verification message
const register = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Show message to check email
    alert('Please check your email to verify your account');
  }
};

// 2. Verify email from link
const verifyEmail = async (token) => {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  const data = await response.json();
  
  if (data.success) {
    alert('Email verified successfully!');
    // Redirect to dashboard
  }
};

// 3. Resend verification email
const resendVerification = async () => {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    credentials: 'include' // Include auth cookie
  });
  
  const data = await response.json();
  
  if (data.success) {
    alert('Verification email sent!');
  }
};

// 4. Show verification banner if not verified
const checkVerificationStatus = async () => {
  const response = await fetch('/api/auth/me', {
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (data.success && !data.user.emailVerified) {
    // Show banner with resend button
    showVerificationBanner();
  }
};
```

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**: Verify EMAIL_USER and EMAIL_PASSWORD in .env
2. **Check firewall**: Ensure port 587 is not blocked
3. **Check spam folder**: Verification emails might be marked as spam
4. **Enable "Less secure app access"**: For Gmail (if not using app passwords)
5. **Check logs**: Look for error messages in console

### Token Expired

Users can request a new verification email using the resend endpoint.

### Already Verified Error

This is expected if user tries to verify again. Frontend should handle this gracefully.

## Production Recommendations

1. **Use Professional Email Service**: SendGrid, AWS SES, or Mailgun for production
2. **Set up SPF/DKIM/DMARC**: Improve email deliverability
3. **Monitor Email Delivery**: Track bounces and failures
4. **Rate Limiting**: Limit resend requests to prevent abuse
5. **Email Queue**: Use Bull or other queue system for large volumes
6. **Custom Domain**: Use your own domain for professional emails

## Next Steps

1. ✅ Update frontend to handle email verification
2. ✅ Add verification banner for unverified users
3. ✅ Create email verification page
4. ⬜ Add email preference management
5. ⬜ Implement password reset via email
6. ⬜ Add email notifications for bookings

## Files Modified/Created

- `prisma/schema.prisma` - Added email verification fields to User model
- `src/services/email.service.ts` - Email sending functionality (NEW)
- `src/services/auth.service.ts` - Added verification and resend functions
- `src/controllers/auth.controller.ts` - Added verification endpoints
- `src/routes/auth.routes.ts` - Added new routes
- `src/middleware/auth.middleware.ts` - Updated to include emailVerified
- `src/utils/token.utils.ts` - Token generation utilities (NEW)
- `.env` - Added email configuration

## Support

For issues or questions, refer to:
- Nodemailer documentation: https://nodemailer.com/
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
