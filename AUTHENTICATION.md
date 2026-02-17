# Authentication System Documentation

## Overview

FloatGreens uses Supabase Auth for secure authentication with the following features:

- **Email/Password Authentication**: Secure user registration and login
- **Password Reset Flow**: Secure password recovery via email
- **Email Verification**: Optional email confirmation on signup
- **Session Management**: Automatic token refresh and secure cookie handling
- **Protected Routes**: Middleware-based route protection
- **User Profile Management**: Integrated logout and account display

## Authentication Flow

### 1. Sign Up (`/signup`)

**Features:**
- Full name, email, and password collection
- Real-time password strength indicator
- Password visibility toggle
- Client-side validation
- Duplicate account detection
- Email verification support

**Password Strength Criteria:**
- ✅ Weak (25%): < 8 characters or basic password
- 🟡 Fair (50%): 8+ characters with some variety
- 🟢 Good (75%): 8+ characters with mixed case and numbers
- 🎯 Strong (100%): 12+ characters with mixed case, numbers, and symbols

**Process:**
1. User enters full name, email, and password
2. Client validates input (email format, password length)
3. Server creates auth user via Supabase
4. User profile created in `users` table
5. Email verification sent (if enabled in Supabase)
6. User redirected to app (or shown confirmation message)

### 2. Sign In (`/login`)

**Features:**
- Email and password input
- Password visibility toggle
- "Forgot password?" link
- Enhanced error messages
- Automatic redirect to requested page

**Process:**
1. User enters credentials
2. Supabase validates credentials
3. Session created and stored in secure cookies
4. User redirected to app (default: `/chat`)

**Error Handling:**
- Invalid credentials → User-friendly message
- Unverified email → Prompt to check inbox
- Account not found → Suggest signup

### 3. Password Reset

#### Request Reset (`/forgot-password`)

**Features:**
- Email input
- Success confirmation
- Resend capability

**Process:**
1. User enters email address
2. Supabase sends password reset email
3. Success message displayed
4. User checks email for reset link

#### Reset Password (`/reset-password`)

**Features:**
- New password input with strength indicator
- Password confirmation
- Visibility toggles
- Session validation

**Process:**
1. User clicks email link (redirects to `/reset-password`)
2. Token validated by Supabase
3. User enters new password (with confirmation)
4. Password updated
5. User redirected to login

### 4. Sign Out

**Features:**
- Accessible from user profile dropdown
- Loading state during sign out
- Automatic session cleanup
- Server-side action for security

**Process:**
1. User clicks "Sign Out" in profile menu
2. Server action called (`signOut()`)
3. Supabase session cleared
4. Cookies removed
5. User redirected to login page

## Security Features

### 1. Route Protection

**Middleware** (`src/middleware.ts`):
- Runs on every request
- Validates session tokens
- Protects app routes (`/chat`, `/garden`, `/dream`, `/bloom`)
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

**Protected Routes:**
```typescript
const PROTECTED_ROUTES = ['/chat', '/garden', '/dream', '/bloom'];
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];
```

### 2. Session Management

**Token Refresh:**
- Automatic token refresh via Supabase SSR
- Handled in middleware for server-side rendering
- Client-side refresh via Supabase client

**Cookie Security:**
- `httpOnly` cookies (not accessible via JavaScript)
- `secure` flag in production (HTTPS only)
- `sameSite` protection against CSRF
- Automatic expiration handling

### 3. Password Security

**Requirements:**
- Minimum 6 characters (configurable in `constants.ts`)
- Hashed using bcrypt by Supabase
- Never stored in plain text
- Rate limiting on auth endpoints (Supabase default)

**Best Practices Encouraged:**
- Password strength indicator guides users
- Suggestions for strong passwords
- Encouragement to use mixed characters

### 4. Email Verification

**Configuration:**
- Enable in Supabase Dashboard → Authentication → Settings
- Email templates customizable in Supabase
- Automatic link generation with secure tokens
- Callback handler at `/auth/callback`

### 5. Rate Limiting

**Supabase Built-in Protection:**
- Login attempts: ~60 per hour per IP
- Password reset: ~6 per hour per email
- Signup: ~30 per hour per IP

**Recommendations:**
- Monitor auth logs in Supabase dashboard
- Enable CAPTCHA for additional protection (Supabase settings)
- Consider additional rate limiting for high-traffic scenarios

## Files Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # Login page
│   │   ├── signup/page.tsx             # Signup page
│   │   ├── forgot-password/page.tsx    # Password reset request
│   │   └── reset-password/page.tsx     # Password reset form
│   ├── (app)/
│   │   └── layout.tsx                  # Protected app layout with user profile
│   ├── auth/
│   │   └── callback/route.ts           # Email verification callback
│   └── middleware.ts                   # Route protection
├── components/
│   └── UserProfile.tsx                 # User dropdown with logout
└── lib/
    ├── auth/
    │   └── actions.ts                  # Server actions (signOut, getCurrentUser)
    ├── supabase/
    │   ├── client.ts                   # Browser client
    │   ├── server.ts                   # Server client
    │   └── middleware.ts               # Session refresh logic
    └── constants.ts                    # Routes and config
```

## Environment Variables

Required in `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only

# Optional: Site URL for email redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL
```

## Supabase Configuration

### 1. Email Templates

Configure in Supabase Dashboard → Authentication → Email Templates:

**Confirm Signup:**
```
Subject: Confirm your FloatGreens account
Body: Click here to confirm: {{ .ConfirmationURL }}
```

**Reset Password:**
```
Subject: Reset your FloatGreens password
Body: Click here to reset: {{ .ConfirmationURL }}
```

### 2. Auth Settings

**Recommended Settings:**
- ✅ Enable email confirmations (optional, based on preference)
- ✅ Disable email change confirmation (until feature needed)
- ✅ Enable password recovery
- ⚠️  Set appropriate password minimum length (default: 6)
- ✅ Configure Site URL for proper redirects
- ✅ Add redirect URLs for callbacks

**Redirect URLs to Add:**
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 3. Row Level Security (RLS)

Ensure RLS policies are configured for the `users` table:

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Allow new users to insert their profile on signup
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

## User Experience Improvements

### 1. Error Messages

All error messages are user-friendly and actionable:
- ❌ "Invalid credentials" → ✅ "Invalid email or password. Please check and try again."
- ❌ "User not found" → ✅ "No account found with this email. Please sign up first."
- ❌ "Email not confirmed" → ✅ "Please verify your email before signing in."

### 2. Loading States

Clear loading indicators throughout:
- Spinning icon with descriptive text
- Disabled buttons during processing
- Smooth transitions

### 3. Password Visibility

Toggle buttons on all password fields:
- Eye icon (👁️) to show password
- Eye with slash (👁️‍🗨️) to hide password
- Accessible labels for screen readers

### 4. Form Validation

Multi-layer validation:
- HTML5 validation (required, email type, minLength)
- Client-side JavaScript validation
- Server-side validation by Supabase
- Real-time feedback (password strength)

## Testing Checklist

- [ ] Sign up with new account
- [ ] Sign up with existing email (should show error)
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password
- [ ] Request password reset
- [ ] Complete password reset flow
- [ ] Toggle password visibility
- [ ] Test password strength indicator
- [ ] Sign out from profile menu
- [ ] Try accessing protected route while logged out
- [ ] Try accessing auth pages while logged in
- [ ] Test email verification (if enabled)

## Troubleshooting

### Issue: "Invalid login credentials"
- **Cause**: Wrong email/password or email not verified
- **Solution**: Check credentials or verify email

### Issue: Email not received
- **Cause**: Supabase email quota or configuration
- **Solution**: Check Supabase logs, verify email settings, check spam folder

### Issue: Redirect loop
- **Cause**: Middleware configuration or session not persisting
- **Solution**: Check middleware matcher, verify environment variables

### Issue: Session expires too quickly
- **Cause**: Default Supabase session duration
- **Solution**: Adjust JWT expiry in Supabase dashboard (default: 1 hour, can extend to 7 days)

## Future Enhancements

Potential improvements for consideration:

1. **OAuth Integration**: Google, GitHub, etc.
2. **Multi-Factor Authentication (MFA)**: SMS or authenticator app
3. **Password History**: Prevent password reuse
4. **Account Lockout**: After multiple failed attempts
5. **Session Management UI**: View/revoke active sessions
6. **Progressive Enhancement**: Work without JavaScript
7. **Account Deletion**: Self-service account removal
8. **Remember Me**: Extended session option

## Support

For issues or questions:
- Review this documentation
- Check Supabase Auth documentation
- Review application logs
- Test in Supabase dashboard
