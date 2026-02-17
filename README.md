# 🌿 FloatGreens - Weekend MVP Boilerplate

FloatGreens is an AI agent that builds a living model of your specific growing space and acts on it autonomously.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local` and fill in your API keys:

```bash
# AWS Bedrock (Model Provider)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# fal.ai (Image Generation)
FAL_KEY=your_fal_key

# OpenWeatherMap
OPENWEATHER_API_KEY=your_weather_key

# Resend (Email)
RESEND_API_KEY=your_resend_key

# Cron secret (generate a random string)
CRON_SECRET=your_random_secret
```

### 3. Set up Supabase

1. Create a new Supabase project
2. Run the migrations in order:
   ```bash
   # In Supabase SQL Editor, run in order:
   # 1. supabase/migrations/001_initial_schema.sql
   # 2. supabase/migrations/002_user_context_memory.sql
   # 3. supabase/migrations/003_auto_create_user_profiles.sql
   ```
3. Enable email auth in Supabase dashboard

**Important:** If you encounter the error `violates foreign key constraint "user_context_memory_user_id_fkey"`, see [MIGRATION_FIX.md](./MIGRATION_FIX.md) for the solution.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
floatgreens/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth pages (login, signup)
│   │   ├── (app)/            # Protected app pages
│   │   │   ├── chat/         # AI agent chat interface
│   │   │   ├── garden/       # Plant ledger (TODO)
│   │   │   ├── dream/        # Dream renders (TODO)
│   │   │   └── bloom/        # Bloom Map (TODO)
│   │   └── api/
│   │       ├── chat/         # AI chat endpoint (Bedrock)
│   │       └── cron/         # Vercel cron jobs
│   ├── lib/
│   │   ├── supabase/         # Supabase client & auth
│   │   ├── ai/               # AI tools & prompts
│   │   ├── weather.ts        # OpenWeatherMap integration
│   │   ├── fal.ts            # fal.ai image generation
│   │   └── email.ts          # Resend email
│   └── middleware.ts         # Auth middleware
├── supabase/
│   └── migrations/           # Database schema
├── public/
│   └── manifest.json         # PWA manifest
└── vercel.json               # Cron configuration
```

## ✅ What's Wired Up

- ✅ Next.js 14 + TypeScript + Tailwind
- ✅ Supabase (Auth + Database + Storage)
- ✅ AWS Bedrock (Claude 3.5 Sonnet via Vercel AI SDK)
- ✅ OpenWeatherMap API
- ✅ fal.ai (Flux Pro for image generation)
- ✅ Resend (Email notifications)
- ✅ Vercel Cron (Weather checks every 6 hours)
- ✅ Auth middleware (protected routes)
- ✅ PWA manifest
- ✅ Agent tool definitions (stubs ready to implement)

## 🛠️ Next Steps (Feature Building)

1. **Onboarding Flow**: Capture balcony photos, orientation, dimensions
2. **Photo Upload**: Supabase Storage integration
3. **Vision Analysis**: Implement Claude Haiku vision via Bedrock
4. **Plant Ledger**: CRUD for plants + health snapshots
5. **Dream Renders**: fal.ai img2img pipeline with ControlNet
6. **Bloom Map**: Stylized sketch generation + community feed

## 🔧 Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📚 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Vercel Edge Functions
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: AWS Bedrock (Claude 3.5 Sonnet, Claude 3 Haiku)
- **AI SDK**: Vercel AI SDK
- **Image Gen**: fal.ai (Flux Pro)
- **Weather**: OpenWeatherMap
- **Email**: Resend
- **Hosting**: Vercel

## 📖 Documentation

- [PRD.md](./PRD.md) - Full product requirements document
- [Supabase Docs](https://supabase.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)

---

**Status**: Boilerplate Complete ✅  
**Next**: Start building features step by step!
