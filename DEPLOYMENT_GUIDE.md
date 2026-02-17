# 🚀 FloatGreens Deployment & Architecture Guide

**Version:** 1.0  
**Last Updated:** 2026-02-17  
**Status:** Production-Ready (Post-Refactoring Phase 7)

---

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 14 Frontend                     │
│  (React Components, TypeScript, Tailwind CSS)              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────────┐  ┌──────▼────────────────┐
│   API Routes         │  │  Authentication      │
│   /api/chat          │  │  (Supabase Auth)     │
│   /api/images        │  │  - OAuth 2.0         │
│   /api/conversations │  │  - Session Management│
└───────┬──────────────┘  └──────┬────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Supabase Backend      │
        │  - PostgreSQL Database  │
        │  - Row Level Security   │
        │  - Storage Buckets      │
        │  - Edge Functions       │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   External Services     │
        │  - AWS Bedrock (AI)     │
        │  - FAL (Image Gen)      │
        │  - Weather API          │
        └────────────────────────┘
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14, React 18 | Server components, SSR |
| Styling | Tailwind CSS | Utility-first styling |
| Type Safety | TypeScript 5 | Type checking |
| Database | Supabase (PostgreSQL) | Data persistence |
| Auth | Supabase Auth | User management |
| AI Models | AWS Bedrock | LLM inference |
| Image Gen | FAL AI | Image generation |
| Validation | Zod | Schema validation |

---

## 🔧 Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... # Public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Secret key (server-side only)

# AWS Bedrock Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email Configuration
SENDGRID_API_KEY=SG... # For password reset emails
```

### Optional Variables

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false

# Performance
REVALIDATE_INTERVAL=3600 # ISR revalidation
```

### Security Notes

- **NEVER** commit `.env.local` files
- Server-side secrets ONLY in `.env.local`
- Use `.env.example` for template
- Rotate keys regularly
- Use separate keys for dev/staging/production

---

## 📦 Deployment Process

### Pre-Deployment Checklist

```bash
# 1. Run tests
npm run test
npm run lint
npm run type-check

# 2. Build optimization
npm run build

# 3. Performance check
npm run lighthouse

# 4. Security audit
npm run audit

# 5. Database migrations
npm run migrate:prod
```

### Vercel Deployment

```bash
# 1. Connect repository
vercel link

# 2. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add other secrets

# 3. Deploy
vercel deploy --prod

# 4. Verify
vercel logs --tail
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY .next ./.next
COPY public ./public

# Run
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and push
docker build -t floatgreens:latest .
docker push your-registry/floatgreens:latest

# Deploy
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  floatgreens:latest
```

---

## 🔐 Security Hardening

### CORS Configuration

```typescript
// Already configured in middleware.ts
// Allows requests only from whitelisted origins
```

### Rate Limiting

```typescript
// Configured in src/lib/rate-limit/
// Chat: 10 requests/minute
// Auth: 5 requests/minute
// Images: 5 uploads/minute
```

### Input Validation

```typescript
// All API inputs validated via Zod schemas
// src/lib/validation/index.ts
// - Message length: max 10,000 characters
// - Image size: max 20 MB
// - File types: JPEG, PNG, WebP, GIF only
```

### Database Security

```sql
-- Row Level Security (RLS) enabled
-- Users can only access their own data
-- Service role for administrative operations
```

---

## 📊 Database Schema

### Key Tables

**users** (managed by Supabase Auth)
- id (UUID, PK)
- email (text, unique)
- created_at (timestamp)

**conversations**
- id (UUID, PK)
- user_id (UUID, FK → users)
- title (text)
- created_at (timestamp)

**messages**
- id (UUID, PK)
- conversation_id (UUID, FK → conversations)
- role (text: 'user' | 'assistant')
- content (text)
- model_id (text, nullable)
- tier (text, nullable)
- image_url (text, nullable)
- created_at (timestamp)

**images**
- id (UUID, PK)
- user_id (UUID, FK → users)
- type (text: 'uploaded' | 'generated')
- storage_path (text)
- url (text)
- description (text, nullable)
- created_at (timestamp)

**user_context_memory**
- id (UUID, PK)
- user_id (UUID, FK → users)
- memory_type (text)
- memory_key (text)
- memory_value (text)
- confidence (numeric)
- created_at (timestamp)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

---

## 🚨 Monitoring & Observability

### Logging

```typescript
// Structured logging throughout codebase
// Format: [CONTEXT] Message: details

// Examples:
// [POST /api/chat] ✓ Saved assistant message
// [middleware] Auth check error: invalid token
// [rate-limit] Cleanup: 42 active limiters
```

### Error Tracking

- Sentry integration (optional)
- Application logs to CloudWatch
- Database query logs in Supabase

### Performance Monitoring

```bash
# Core Web Vitals
- FCP < 1.8s
- LCP < 2.5s
- CLS < 0.1
- TTFB < 600ms

# Custom metrics
- Chat response time
- Image upload time
- Database query latency
```

---

## 🔄 Rollback Procedure

### Git-Based Rollback

```bash
# If deployment fails, revert to baseline
git checkout pre-refactor-baseline
git push origin main --force

# Or revert specific commit
git revert <commit-hash>
```

### Database Rollback

```sql
-- Supabase has automatic backups
-- Restore from Supabase dashboard:
-- Settings → Backups → Restore
```

---

## 📚 API Documentation

### POST /api/chat

**Request:**
```bash
POST /api/chat
Content-Type: multipart/form-data

message=Hello&image=<file>
```

**Response:**
```
Content-Type: text/event-stream

data: Hello there!
data: How can I help?
data: [DONE]
```

**Rate Limit:** 10 requests/minute per user

### GET /api/conversations

**Request:**
```bash
GET /api/conversations/[id]
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Plant care tips",
    "created_at": "2026-02-17T..."
  }
]
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Auth error` | Invalid token | Re-login |
| `Rate limited` | Too many requests | Wait 1 minute |
| `Image too large` | >20MB | Resize and retry |
| `500 error` | Server error | Check logs |
| `Validation error` | Invalid input | Check message length |

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check database
psql $DATABASE_URL

# Monitor API
npm run dev -- --experimental-json-logs
```

---

## 📝 Changelog

### v1.0.0 - Production Release (2026-02-17)

**New:**
- ✅ Production-grade refactoring (80%+ complete)
- ✅ Input validation with Zod schemas
- ✅ Rate limiting (token bucket algorithm)
- ✅ Image optimization (Next.js Image)
- ✅ Component memoization
- ✅ Database performance indexes
- ✅ WCAG 2.1 accessibility helpers
- ✅ Comprehensive testing framework

**Fixed:**
- Fixed chat message race condition
- Fixed image analysis error handling
- Fixed duplicate system prompt
- Fixed memory extraction validation

**Improved:**
- Better error messages
- Faster image loading
- Smoother chat interactions
- Enhanced security

---

## 📞 Support & Resources

**Documentation**
- README.md - Quick start guide
- REFACTORING_SUMMARY.md - Refactoring details
- TESTING_VALIDATION.md - Testing procedures
- This file - Deployment guide

**Rollback**
- Git tag: `pre-refactor-baseline`
- Database backups: Supabase Console

**Contacts**
- Tech Lead: [name]
- DevOps: [name]
- On-Call: [rotation]
