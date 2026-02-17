# FloatGreens — Product Requirements Document (v1.0)

> **Document Status:** MVP Retrofit  
> **Last Updated:** February 2026  
> **Scope:** Current production state + strategic roadmap

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Purpose](#2-company-purpose)
3. [Problem Statement](#3-problem-statement)
4. [Solution](#4-solution)
5. [Why Now](#5-why-now)
6. [Target Market](#6-target-market)
7. [Current MVP Scope](#7-current-mvp-scope)
8. [Technical Architecture](#8-technical-architecture)
9. [Agent Personality & Boundaries](#9-agent-personality--boundaries)
10. [Business Model](#10-business-model)
11. [Competitive Landscape](#11-competitive-landscape)
12. [Key Metrics](#12-key-metrics)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Post-MVP Roadmap](#14-post-mvp-roadmap)
15. [Appendix A: Rebranding Debate](#appendix-a-rebranding-debate)

---

## 1. Executive Summary

**FloatGreens** is an AI-powered spatial botanist that builds and maintains a living model of users' growing spaces - primarily urban balconies. Unlike generic plant care apps, FloatGreens remembers your specific setup: orientation, light patterns, microclimate, plant inventory, and past failures. It acts proactively (weather alerts, early disease detection) rather than reactively.

**MVP Status:** Live and functional. Core chat interface, image analysis, memory system, and gallery operational.

**North Star Metric:** Plants saved from preventable death through proactive intervention.

---

## 2. Company Purpose

> *"The only AI that knows your balcony better than you do."*

FloatGreens exists to transform urban dwellers into confident growers by eliminating the knowledge gap that kills plants. We believe every small space deserves the same agricultural rigor as a commercial farm—personalized, data-driven, and anticipatory.

---

## 3. Problem Statement

### The Urban Gardening Crisis

| Pain Point | Reality | Cost |
|-----------|---------|------|
| **Generic advice kills plants** | "Water once a week" ignores your south-facing Mumbai balcony hitting 45°C | 70% of houseplants die within first year |
| **No memory, no continuity** | Every Google search starts from zero. No one remembers your setup. | Repeated failures → learned helplessness |
| **Reactive, never proactive** | You notice the problem when leaves are already yellow | By then, it's often too late |
| **Isolation in urban spaces** | Neighbors growing the same plants 10m away—you'll never know | Lost community intelligence |

### Who Feels This Pain Most?

- **Urban millennials/Gen-Z** in apartments (70M+ in India alone)
- **First-time plant parents** who've killed 2-3 plants and are demoralized
- **Time-poor professionals** who want results without becoming botanists
- **Renters** who can't modify spaces but want greenery

---

## 4. Solution

### What FloatGreens Does Differently

| Generic Plant App | FloatGreens |
|-------------------|-------------|
| "Tomatoes need 6-8 hours of sun" | "Your NE-facing balcony gets 4.5 hours—here's what actually thrives" |
| Search-based Q&A | Continuous memory—we remember your clay soil, your drainage problems |
| You notice → you ask | We notice → we warn you before the heatwave hits |
| Isolated user experience | Hyperlocal intelligence from your neighborhood's balconies |

### Core Product Pillars

1. **Spatial Memory** — Every conversation builds our model of YOUR space
2. **Proactive Agency** — Weather monitoring, early disease detection, seasonal prep
3. **Visual Intelligence** — Photo analysis for plant ID, health checks, problem diagnosis
4. **Local Network** (future) — Community knowledge graph by postal code + orientation

---

## 5. Why Now

### Market Timing Factors

1. **Urban gardening boom post-COVID** — 65% increase in houseplant purchases (2020-2024)
2. **AI capabilities matured** — Vision models (Claude, Rekognition) now production-ready
3. **Climate volatility** — Unpredictable weather makes proactive care more valuable
4. **Smartphone penetration** — Camera-first interaction finally natural
5. **Loneliness epidemic** — Plants as companions; 40% of urban dwellers cite plants for mental health

### Competitive Window

Generic plant ID apps exist (PictureThis, PlantNet) but none have:
- Persistent memory per user
- Spatial understanding (orientation, microclimate)
- Proactive autonomous actions

First mover advantage in "spatial botanist" category is available NOW.

---

## 6. Target Market

### Market Sizing

| Segment | Size | Notes |
|---------|------|-------|
| **TAM** | $8.5B | Global houseplant market (2025 est.) |
| **SAM** | $1.2B | Urban apartment dwellers with balconies in Tier-1 cities |
| **SOM** | $50M | India + SEA English-speaking urban millennials (Y1 focus) |

### Primary Persona: "Priya"

- 28yo, Bangalore, tech PM at startup
- Lives in 2BHK apartment, 8sqm balcony facing East
- Has killed 4 plants in 2 years (overwatering, wrong placement)
- Wants a "green corner" but doesn't have time to become an expert
- Will pay ₹299/month if it actually works

### Secondary Persona: "Arjun"

- 35yo, Mumbai, works from home, enthusiast level
- 20+ plants, experiments with varieties
- Wants advanced diagnostics, seasonal planning, community swaps
- Willing to pay ₹599/month for premium features

---

## 7. Current MVP Scope

### What's Live

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **AI Chat Interface** | Conversational botanist with personality | AWS Bedrock (Claude Sonnet/Haiku, Nova Pro) |
| **3-Tier Model Router** | Cost-optimized routing by query complexity | Custom classifier → T1/T2/T3 models |
| **Image Analysis** | Plant ID, health assessment from photos | AWS Rekognition + Claude vision |
| **My Garden Gallery** | User's uploaded/generated images with favorites | Supabase Storage + metadata |
| **Memory System** | Persistent context: preferences, constraints, observations | Custom memory schema with upsert |
| **User Authentication** | Email/password signup, password reset | Supabase Auth |
| **Weather Integration** | Real-time weather data (wired, awaiting full integration) | OpenWeatherMap API |
| **Rate Limiting** | Per-user request throttling | In-memory sliding window |

### What's Stubbed (Ready for Implementation)

| Feature | Status | Dependency |
|---------|--------|------------|
| Dream Renders | API wired, prompt ready | fal.ai Flux Pro |
| Agent Tools | Schema defined, execution stubbed | AI SDK v6 migration needed |
| Weather Alerts | Cron job exists | Email notification flow |
| Onboarding Flow | Not started | UI screens |

### Database Schema (Active Tables)

```
users                  — Profile extending Supabase auth
conversations          — Chat threads per user
chat_messages          — Messages with model/tier tracking
user_context_memory    — Append-only memory system
images                 — Uploaded/generated images
balconies              — Growing space definitions (ready)
plants                 — Plant inventory (ready)
health_snapshots       — Photo analysis history (ready)
agent_actions          — Proactive notifications (ready)
```

---

## 8. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Chat UI    │  │  My Garden  │  │  Auth (login/signup)    │  │
│  │  (streaming)│  │  Gallery    │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER (Next.js Routes)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  /api/chat  │  │ /api/images │  │  /api/conversations     │  │
│  │  (streaming)│  │  (CRUD)     │  │  (history)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│  AWS Bedrock    │ │  Supabase       │ │  External APIs          │
│  ├─ Claude 3.5  │ │  ├─ Auth        │ │  ├─ OpenWeatherMap      │
│  ├─ Claude Haiku│ │  ├─ PostgreSQL  │ │  ├─ fal.ai (stubbed)    │
│  ├─ Nova Pro    │ │  └─ Storage     │ │  └─ Resend (email)      │
│  └─ Rekognition │ │                 │ │                         │
└─────────────────┘ └─────────────────┘ └─────────────────────────┘
```

### Model Routing Strategy (3-Tier)

| Tier | Model | Use Case | Cost (per 1M tokens) |
|------|-------|----------|---------------------|
| T1 | Nova Pro | Greetings, simple Q&A, acknowledgments | $0.80 / $3.20 |
| T2 | Claude Haiku 3.5 | Care guidance, diagnostics, recommendations | $0.80 / $4.00 |
| T3 | Claude Sonnet 3.5 | Complex planning, design, image analysis | $3.00 / $15.00 |

**Classification Logic:**
- Images → always T3 (quality matters for diagnosis)
- Design/planning keywords → T3
- Diagnostic/care keywords → T2
- Short greetings/acks → T1
- Default → T2 (better UX over cost savings)

### Memory System Architecture

```
SOUL (immutable)
    ↓
System Prompt (behavioral)
    ↓
Personalization (context memory)
    ↓
Ephemeral Context (current conversation)
```

**Memory Types:**
- `preference` — User preferences (e.g., "prefers organic solutions")
- `constraint` — Physical limits (e.g., "limited morning sun")
- `goal` — Stated objectives (e.g., "wants herb garden")
- `observation` — Agent-noticed patterns
- `success` / `failure` — Outcome tracking
- `interaction` — Communication style preferences

---

## 9. Agent Personality & Boundaries

### The SOUL (Immutable Core Identity)

FloatGreens is not a search engine for gardening tips. It is a **spatial botanist with perfect memory** who:

1. Knows your specific space—orientation, light, wind, soil
2. Remembers your wins and failures
3. Anticipates problems before they escalate
4. Celebrates specifically ("That tomato set fruit 9 days faster than last season!")
5. Never makes you feel bad about neglect or ignorance

### Tone & Style

- **Cheeky but helpful** — Personality without being annoying
- **Concise** — Under 150 words unless depth requested
- **Specific** — References actual user context, not generic advice
- **Action-first** — Lead with what to do, explain after

### Boundary Behavior (Critical)

The agent MUST politely decline engagement on:

**Off-Topic Requests:**
> "I'm here to help your plants thrive! That topic's outside my garden gates, but I'd love to chat about your balcony setup or any plant questions you have. 🌱"

**Sensitive/Controversial Topics:**
> "I'm just a plant nerd—politics, religion, and drama are way above my pay grade! But if you want to debate whether monstera or fiddle leaf is the ultimate statement plant, I'm ALL in. 🪴"

**Personal Advice (non-gardening):**
> "I wish I could help with that, but my expertise stops at photosynthesis! For plant therapy though? I'm your person. What's growing in your space?"

**Categories to Decline:**
- Political opinions or commentary
- Religious or spiritual advice
- Medical/health advice (human)
- Financial/investment guidance
- Relationship or personal life coaching
- News events or current affairs
- Anything illegal or harmful

**Redirect Pattern:** Acknowledge → Decline warmly → Pivot to gardening

---

## 10. Business Model

### Revenue Strategy

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 messages/day, basic plant ID, 5 photo gallery |
| **Grow** | ₹299/mo (~$3.50) | Unlimited chat, memory persistence, weather alerts, 50 photo gallery |
| **Pro** | ₹599/mo (~$7) | Dream renders, seasonal planning, priority support, unlimited gallery, API access |

### Unit Economics (Target)

| Metric | Target |
|--------|--------|
| CAC | < ₹500 |
| LTV | ₹3,600 (12mo retention @ ₹299) |
| LTV:CAC | > 7:1 |
| Gross Margin | > 70% |
| Churn | < 8% monthly |

### Cost Structure

- **AI inference:** ~₹15/user/month (blended across tiers)
- **Infrastructure:** ~₹5/user/month (Supabase, Vercel)
- **Total COGS:** ~₹20/user/month
- **Gross margin @ ₹299:** ~93%

---

## 11. Competitive Landscape

### Market Map

```
                    HIGH PERSONALIZATION
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         │   FloatGreens   │                 │
         │   (target)      │                 │
         │                 │                 │
REACTIVE ─────────────────────────────────── PROACTIVE
         │                 │                 │
         │   PictureThis   │    Smart        │
         │   PlantNet      │    Planters     │
         │   Greg          │    (hardware)   │
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    LOW PERSONALIZATION
```

### Competitor Analysis

| Competitor | Strength | Weakness | Our Edge |
|------------|----------|----------|----------|
| **PictureThis** | Plant ID accuracy, 100M+ downloads | No memory, generic advice | Persistent spatial context |
| **Greg** | Watering reminders, cute UX | One-size-fits-all schedules | Microclimate-aware scheduling |
| **Planta** | Beautiful UI, plant database | No AI conversation, no proactivity | Natural language + anticipation |
| **Smart planters** | Hardware sensors, automation | Expensive ($100+), single plant | Software-first, whole garden view |

### Defensibility

1. **Memory moat** — More conversations = richer context = better advice = harder to switch
2. **Local network effects** — Community knowledge by postal code creates lock-in
3. **Proprietary training data** — Conversation logs become unique dataset (with consent)

---

## 12. Key Metrics

### North Star

**Plants Saved** — Measurable via health score improvements and reduced "my plant is dying" queries per user over time.

### Primary Metrics

| Metric | Definition | Target (M3) |
|--------|------------|-------------|
| **DAU/MAU** | Daily engagement ratio | > 25% |
| **Messages/User/Day** | Chat engagement | 3+ |
| **Photos Uploaded/User/Month** | Visual engagement | 5+ |
| **Retention D7/D30** | Cohort retention | 60% / 40% |
| **Conversion Free→Paid** | Monetization | > 5% |

### Secondary Metrics

- Memory entries per user (context richness)
- Model tier distribution (cost efficiency)
- Time to first value (< 2 minutes)
- NPS score (target: > 50)

---

## 13. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **AI hallucinations harm plants** | Medium | High | Confidence scoring, "I'm not sure" responses, photo verification |
| **High inference costs at scale** | Medium | High | 3-tier routing already implemented, continuous optimization |
| **User churn after initial curiosity** | High | High | Memory-driven personalization, proactive alerts keep value flowing |
| **Competitor copies features** | Medium | Medium | Speed to market, memory moat, community network effects |
| **Privacy concerns with plant photos** | Low | Medium | Clear data policy, no sale to third parties, user deletion rights |
| **Weather API reliability** | Low | Medium | Fallback providers, graceful degradation |

---

## 14. Post-MVP Roadmap

### Phase 2: Foundation (Q2 2026)

| Feature | Priority | Effort |
|---------|----------|--------|
| Onboarding flow (3 photos, 2 questions) | P0 | 2 weeks |
| Plant Ledger CRUD | P0 | 2 weeks |
| Weather alert notifications (email) | P1 | 1 week |
| Dream Render integration (fal.ai) | P1 | 1 week |

### Phase 3: Engagement (Q3 2026)

| Feature | Priority | Effort |
|---------|----------|--------|
| Seasonal planning calendar | P1 | 3 weeks |
| Push notifications (mobile) | P1 | 2 weeks |
| Travel mode (vacation prep) | P2 | 2 weeks |
| Health score tracking over time | P2 | 2 weeks |

### Phase 4: Community (Q4 2026)

| Feature | Priority | Effort |
|---------|----------|--------|
| Bloom Map (anonymous sharing by postal code) | P1 | 4 weeks |
| Local swap marketplace | P2 | 4 weeks |
| Community tips feed | P2 | 2 weeks |

### Phase 5: Scale (2027)

- Mobile native apps (iOS/Android)
- Multi-language support (Hindi, Spanish, Portuguese)
- B2B: Nursery partnerships, smart planter integrations
- International expansion (SEA, LATAM)

---

## Appendix A: Rebranding Debate

### Current Name Analysis: "FloatGreens"

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Memorability** | 6/10 | Unusual but not immediately evocative |
| **Domain availability** | ✅ | floatgreens.app owned |
| **SEO potential** | 5/10 | "Float" not associated with plants |
| **Brand story** | 6/10 | "Floating gardens" angle exists but weak |
| **Global appeal** | 7/10 | English-friendly, no cultural baggage |
| **Uniqueness** | 8/10 | No direct competitors with similar name |

### Alternative Candidates

#### Option 1: **Verdant** (or Verdant.ai)

| Criterion | Score | Notes |
|-----------|-------|-------|
| Memorability | 7/10 | Single word, evocative of lush greenery |
| Domain availability | ⚠️ | verdant.com taken; verdant.ai likely available |
| SEO potential | 8/10 | Plant-adjacent, premium feel |
| Brand story | 8/10 | "Make your space verdant" |
| Global appeal | 6/10 | English word, may not translate |
| Uniqueness | 6/10 | Some lifestyle brands use it |

**Argument FOR:** Sophisticated, single-word, evokes the outcome we deliver.

**Argument AGAINST:** May feel too "premium" for casual users; not immediately tech-forward.

---

#### Option 2: **Sprout.ai**

| Criterion | Score | Notes |
|-----------|-------|-------|
| Memorability | 8/10 | Common word, immediately understood |
| Domain availability | ❌ | sprout.ai likely taken (HR tech) |
| SEO potential | 6/10 | Crowded space (Sprout Social, etc.) |
| Brand story | 9/10 | Growth metaphor is perfect |
| Global appeal | 8/10 | Universal concept |
| Uniqueness | 4/10 | Heavily used across industries |

**Argument FOR:** Instant comprehension, growth metaphor aligns perfectly.

**Argument AGAINST:** Trademark conflicts likely; sprout fatigue in market.

---

#### Option 3: **Balconia**

| Criterion | Score | Notes |
|-----------|-------|-------|
| Memorability | 7/10 | Playful, clear focus |
| Domain availability | ✅ | balconia.app likely available |
| SEO potential | 7/10 | Own the "balcony garden" niche |
| Brand story | 9/10 | "Your balcony's best friend" |
| Global appeal | 7/10 | Balcony is understood globally |
| Uniqueness | 9/10 | No major competitors |

**Argument FOR:** Niche-defining, memorable, clear positioning.

**Argument AGAINST:** Limits perceived scope (what about terraces, patios?).

---

#### Option 4: **Canopy**

| Criterion | Score | Notes |
|-----------|-------|-------|
| Memorability | 8/10 | Elegant, evokes protection |
| Domain availability | ⚠️ | canopy.app may be taken |
| SEO potential | 5/10 | Canopy tax software is dominant |
| Brand story | 7/10 | "Under your garden's canopy" |
| Global appeal | 8/10 | Universal imagery |
| Uniqueness | 5/10 | Used across industries |

**Argument FOR:** Premium feel, protection metaphor aligns with proactive care.

**Argument AGAINST:** SEO competition, no immediate plant connection.

---

#### Option 5: **Rootwise**

| Criterion | Score | Notes |
|-----------|-------|-------|
| Memorability | 8/10 | Compound word, suggests expertise |
| Domain availability | ✅ | rootwise.app likely available |
| SEO potential | 7/10 | "Root" is plant-forward |
| Brand story | 9/10 | "Wisdom from the roots up" |
| Global appeal | 7/10 | English-dependent |
| Uniqueness | 8/10 | Few conflicts |

**Argument FOR:** Expertise positioning, plant connection, .app available.

**Argument AGAINST:** Could feel too serious/educational vs. friendly.

---

### Recommendation

**Keep "FloatGreens" for MVP phase.** Rationale:

1. **Rebranding costs time and momentum** — Focus should be on product-market fit
2. **Current name is functional** — No major negatives, domain secured
3. **Wait for user language** — Let community generate organic name associations
4. **Rebrand decision at Series A** — With brand agency budget and market validation

**Dissenting View:** If pursuing US market aggressively, "Rootwise" or "Verdant" have stronger premium positioning. "FloatGreens" may feel too casual for higher price points.

**Decision:** Defer rebranding to Q4 2026. Monitor user feedback and competitive moves.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 2026 | Product Team | Initial MVP retrofit |

---

*This document reflects the product as built, not aspirational features. All claims about implemented functionality are verifiable in the codebase.*
