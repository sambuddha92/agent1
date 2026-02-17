# 🚀 Floatgreens Go-Live Checklist

Complete checklist for deploying Floatgreens to production at `https://floatgreens.sambuddhaadhikari.com`

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables (Vercel Dashboard)

Navigate to: **Vercel Project → Settings → Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | ✅ |
| `FAL_KEY` | fal.ai API key for image generation | ✅ |
| `RESEND_API_KEY` | Resend API key for emails | ✅ |
| `OPENWEATHER_API_KEY` | OpenWeather API key | ⚠️ Optional |

- [ ] All required environment variables added to Vercel
- [ ] Variables set for **Production** environment

---

### 2. Supabase Configuration

Navigate to: **Supabase Dashboard → Your Project**

#### 2.1 URL Configuration
**Location:** Authentication → URL Configuration

- [ ] **Site URL** set to:
  ```
  https://floatgreens.sambuddhaadhikari.com
  ```

- [ ] **Redirect URLs** include ALL of these:
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/**
  https://floatgreens.sambuddhaadhikari.com/auth/callback
  https://floatgreens.sambuddhaadhikari.com/**
  ```

#### 2.2 Google OAuth Provider
**Location:** Authentication → Providers → Google

- [ ] Google provider **enabled**
- [ ] Client ID added (from Google Cloud Console)
- [ ] Client Secret added (from Google Cloud Console)

#### 2.3 Database
**Location:** SQL Editor or Migrations

- [ ] All migrations applied (check `supabase/migrations/`)
- [ ] RLS (Row Level Security) policies verified
- [ ] Tables created:
  - [ ] `profiles`
  - [ ] `user_context_memory`
  - [ ] `conversations`
  - [ ] `messages`
  - [ ] `images`

#### 2.4 Storage
**Location:** Storage

- [ ] Storage bucket for images created
- [ ] Storage policies configured

---

### 3. Google Cloud Console Configuration

Navigate to: **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**

#### 3.1 OAuth 2.0 Client ID Settings

- [ ] **Authorized JavaScript Origins** include:
  ```
  http://localhost:3000
  https://floatgreens.sambuddhaadhikari.com
  ```

- [ ] **Authorized Redirect URIs** include:
  ```
  http://localhost:3000/auth/callback
  https://floatgreens.sambuddhaadhikari.com/auth/callback
  https://<YOUR-SUPABASE-REF>.supabase.co/auth/v1/callback
  ```

#### 3.2 OAuth Consent Screen
**Location:** APIs & Services → OAuth consent screen

- [ ] App name configured
- [ ] User support email set
- [ ] App logo uploaded (optional)
- [ ] Privacy policy URL (if required)
- [ ] Terms of service URL (if required)
- [ ] App verified (if requesting sensitive scopes)

---

### 4. AWS Configuration

#### 4.1 IAM User/Role Permissions

- [ ] IAM user created for the app
- [ ] Permissions attached:
  - [ ] `bedrock:InvokeModel` (for AI chat)
  - [ ] `rekognition:DetectLabels` (for image analysis)
  - [ ] `rekognition:DetectText` (for image analysis)

#### 4.2 AWS Bedrock
**Location:** AWS Console → Bedrock → Model access

- [ ] Required models enabled:
  - [ ] Claude (Anthropic) models
  - [ ] Any other models used

---

### 5. Vercel Deployment

Navigate to: **[Vercel Dashboard](https://vercel.com/dashboard)**

#### 5.1 Project Setup
- [ ] Project connected to GitHub repo (`sambuddha92/agent1`)
- [ ] Framework preset: **Next.js**
- [ ] Build command: `next build`
- [ ] Output directory: `.next`

#### 5.2 Domain Configuration
- [ ] Production domain added: `floatgreens.sambuddhaadhikari.com`
- [ ] SSL certificate active (auto-provisioned)

#### 5.3 Cron Jobs
- [ ] Weather check cron verified: `/api/cron/weather-check` (every 6 hours)

---

### 6. Domain & DNS

#### 6.1 DNS Records
Add these records in your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | floatgreens | cname.vercel-dns.com |
| OR A | floatgreens | 76.76.21.21 |

- [ ] DNS records configured
- [ ] DNS propagation complete (can take up to 48 hours)
- [ ] Domain verified in Vercel

---

### 7. Third-Party Services

#### 7.1 Resend (Email)
- [ ] Domain verified in Resend
- [ ] API key generated
- [ ] From email configured

#### 7.2 fal.ai (Image Generation)
- [ ] Account created
- [ ] API key generated
- [ ] Billing configured (if needed)

#### 7.3 OpenWeather (Optional)
- [ ] API key generated
- [ ] Subscription tier confirmed

---

## ✅ Pre-Launch Testing

### Authentication Flows
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google OAuth signup works
- [ ] Google OAuth login works
- [ ] Password reset email sent
- [ ] Password reset flow completes
- [ ] Logout works

### Core Features
- [ ] Chat messages send/receive
- [ ] AI responses generate correctly
- [ ] Image upload works
- [ ] Image gallery displays correctly
- [ ] Image deletion works
- [ ] Favorites feature works

### Mobile Testing
- [ ] Responsive on iPhone
- [ ] Responsive on Android
- [ ] Touch interactions work
- [ ] Camera capture works (mobile)

### Performance
- [ ] Page load times acceptable
- [ ] No console errors
- [ ] No 500 errors in Vercel logs

---

## 🔒 Security Checklist

- [ ] No secrets/API keys in source code
- [ ] `.env` files in `.gitignore`
- [ ] Supabase RLS policies enabled
- [ ] API routes protected where needed
- [ ] Rate limiting configured
- [ ] CORS settings appropriate

---

## 📝 Post-Launch

- [ ] Monitor Vercel analytics
- [ ] Monitor Supabase usage
- [ ] Monitor AWS costs
- [ ] Set up error alerting (optional)
- [ ] Backup strategy in place

---

## 🆘 Troubleshooting

### OAuth Not Working
1. Check redirect URLs in Supabase match exactly
2. Check Google Console origins/redirects
3. Clear browser cookies and try again
4. Check Supabase auth logs

### Images Not Loading
1. Check storage bucket policies
2. Verify storage bucket exists
3. Check CORS settings on bucket

### AI Chat Not Responding
1. Verify AWS credentials in Vercel
2. Check Bedrock model access
3. Review Vercel function logs

---

## 📞 Quick Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [AWS Console](https://console.aws.amazon.com)
- [Resend Dashboard](https://resend.com)
- [fal.ai Dashboard](https://fal.ai)

---

*Last updated: February 2026*
