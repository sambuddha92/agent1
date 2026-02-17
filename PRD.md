## 1. Product Vision & Value Proposition

### The Problem

Small-space gardeners operate in a **data desert**. Every balcony is a unique microbiome — 6th floor west-facing in Mumbai behaves nothing like ground-floor east-facing in Berlin — yet all gardening advice online is generic. Current AI tools offer "chat about plants" with zero persistent spatial awareness. The result: 60%+ plant mortality in the first season, wasted money, and abandoned hobby potential.

### The Vision

**FloatGreens is an AI agent that builds a living model of your specific growing space and acts on it autonomously.** It doesn't wait for questions. It watches the weather, remembers your soil, tracks your plants' health over time, and connects you to neighbors growing the same things.

### The "Weekend-to-Millions" Thesis

```
Weekend MVP (5 users)     →  Spatial Context Memory per user
Month 3 (500 users)       →  Neighborhood micro-climate patterns emerge
Month 12 (50K users)      →  The "Green Graph" — a hyperlocal growth-outcome
                              dataset that no LLM or seed company possesses
Year 3 (1M users)         →  FloatGreens becomes the Waze of urban gardening:
                              community-contributed intelligence that
                              compounds with every photo upload
```

**The compounding moat is simple:** every photo uploaded, every harvest logged, every failed tomato plant recorded feeds a neighborhood-specific growth model. By the time a competitor ships a clone, FloatGreens has 18 months of micro-climate truth data they cannot replicate without the same user base.

### Value Proposition (One-liner)

> *"FloatGreens turns your phone camera into a balcony botanist that never forgets, never sleeps, and knows what's growing on every balcony in your neighborhood."*

---

## 2. Persona Profiles

### Persona 1: Annika — The Aesthetic Planner (Foundation)

| Attribute | Detail |
|-----------|--------|
| **Age/Location** | 31, Berlin-Kreuzberg, 4th floor south-facing balcony (3m × 1.2m) |
| **Goal** | A Pinterest-worthy balcony that looks intentional, not chaotic |
| **Tech Comfort** | High — uses Canva, Pinterest, Instagram daily |

**Typical Week:** Sunday morning: scrolls Pinterest for balcony inspo. Buys 3 plants from the market based on aesthetics. Wednesday: one is already drooping. Googles frantically. Friday: rearranges everything, takes photo, gets 12 likes.

**Pain Points:**
- Cannot visualize how plants will *actually* look on her specific balcony before buying
- Color clashes and height mismatches ruin the "vibe"
- No way to know which aesthetic choices are also *functional* for her light conditions

**10x Value Story:** *Annika photographs her empty spring balcony. FloatGreens generates three "dream renders" — Mediterranean herb wall, Japanese minimal, tropical jungle — all using only plants that thrive in her specific south-facing Berlin microclimate. She taps "Mediterranean," and FloatGreens produces a shopping list with nursery links, a placement guide, and a 90-day growth projection showing what it'll look like by August.*

---

### Persona 2: Raj — The Harvest Hunter (Food Focus)

| Attribute | Detail |
|-----------|--------|
| **Age/Location** | 44, Mumbai-Andheri, east-facing windowsill + 2m × 2m terrace corner |
| **Goal** | Maximize edible yield from minimal space — chilies, tomatoes, herbs, microgreens |
| **Tech Comfort** | Moderate — uses WhatsApp, YouTube gardening channels |

**Typical Week:** Monday: checks on tomato plants before work, notices yellowing leaves, takes a photo but doesn't know who to ask. Wednesday: hand-pollinates chili flowers based on a YouTube video he half-watched. Saturday: harvests a handful of mint, wishes he had enough basil for the week. Sunday: browses nursery, overwhelmed by seed varieties.

**Pain Points:**
- Cannot diagnose plant health issues fast enough — by the time he Googles, the pest has spread
- No yield tracking — doesn't know if his setup is improving season over season
- Wants to grow year-round but doesn't understand Mumbai's monsoon/winter/summer rotation planning
- Wastes money on seeds and soil amendments that don't match his conditions

**10x Value Story:** *Raj uploads a photo of his yellowing tomato leaves at 7:15 AM. By 7:16 AM, FloatGreens has identified early-stage magnesium deficiency (not the nitrogen issue he assumed), cross-referenced with 14 other east-facing Mumbai terrace growers who reported the same issue in June, and recommended a specific Epsom salt foliar spray schedule calibrated to his container size. Three weeks later, his yield is up 40%. FloatGreens logs this outcome, strengthening the recommendation for the next Mumbai grower.*

---

### Persona 3: Suki — The Hands-Off Optimizer (Tech Focus)

| Attribute | Detail |
|-----------|--------|
| **Age/Location** | 28, San Francisco SOMA, north-facing fire escape + 2 window boxes |
| **Goal** | Keep plants alive with absolute minimum time investment; automate everything possible |
| **Tech Comfort** | Very high — software engineer, has Home Assistant, loves dashboards |

**Typical Week:** Monday-Friday: glances at plants while making coffee, occasionally remembers to water. Travels every other weekend. Returns to find one plant dead, one thriving, no idea why. Considers buying a $200 smart planter, reads reviews, abandons cart.

**Pain Points:**
- Forgets watering schedules — needs push notifications calibrated to actual weather, not generic "every 3 days"
- Travels frequently; no way to know if plants survived while away
- Wants data: growth rates, health scores, ROI on time invested
- North-facing SF = limited light; needs plants that tolerate neglect AND low light

**10x Value Story:** *Suki onboards in 4 minutes: 3 photos, compass direction, "I forget to water." FloatGreens builds her profile: north-facing, fog belt, neglect-tolerant requirement. It recommends 5 plants ranked by "survival probability given your care pattern." Every Monday and Thursday at 7 AM, FloatGreens checks SF weather and pushes: "Water the pothos, skip the snake plant (fog moisture sufficient)." When Suki travels, FloatGreens sends a pre-trip prep checklist and monitors weather while she's gone. She returns to zero dead plants for the first time ever.*

---

## 3. High-Frequency Agentic User Stories

These are stories where the **agent acts**, not where the user asks.

| # | User Story | Trigger | Agent Action | Persona |
|---|-----------|---------|-------------|---------|
| **US-1** | Agent notices a heatwave forecast and drafts a customized watering schedule for my specific plant inventory | Weather API: 3-day forecast > 35°C for user's location | Cross-references user's plant inventory heat tolerance, container sizes, and balcony sun exposure → generates adjusted watering schedule → pushes notification with one-tap "Apply Schedule" | Raj, Suki |
| **US-2** | Agent detects early pest/disease from a routine photo upload and intervenes before spread | User uploads weekly growth photo (or scheduled reminder photo) | Vision model analyzes leaf patterns → identifies aphid cluster at 82% confidence → recommends neem oil spray with dosage for user's container volume → schedules follow-up check in 5 days | Raj |
| **US-3** | Agent generates a "Dream Balcony" render from a bare photo, using only locally-viable plants | User uploads photo of empty/current balcony + selects aesthetic preference | img2img pipeline maintains balcony structure → fills with plants filtered by user's light/climate/zone → outputs render + shopping list + placement guide | Annika |
| **US-4** | Agent identifies a "Plant Twin" nearby and facilitates a cutting/seed swap | User logs a mature plant → Agent matches against other users in same postal code prefix with compatible plants | Notifies both users: "A gardener 2km from you has mature rosemary cuttings available. You have mint they're looking for. Initiate swap?" | All |
| **US-5** | Agent builds a seasonal rotation plan based on accumulated local success data | Start of new season (equinox-triggered) | Analyzes user's past season outcomes + neighborhood success rates → proposes next season's lineup ranked by predicted success × user goals (yield/aesthetic/low-effort) | Raj, Suki |
| **US-6** | Agent sends a "Weekend away" prep protocol before detected travel | User's calendar integration detects 3+ day gap (or manual "I'm traveling" trigger) | Generates pre-trip checklist: deep water schedule, move shade-sensitive plants, set up wick watering for specific containers → sends daily status inference based on weather while away | Suki |
| **US-7** | Agent curates the Bloom Map feed with anonymized neighborhood inspiration | New stylized balcony sketch enters user's postal zone | "A gardener in your area just shared their monsoon herb setup — 4 plants you could grow too. Tap to see the sketch and adapt their layout to your space." | Annika |

---

## 4. Functional Specifications

### 4.1 Vision-to-Render Engine ("Photo → Dream Balcony")

**Pipeline Overview:**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  User Photo   │────▶│  ControlNet   │────▶│   Flux img2img   │────▶│ Dream Render │
│  (balcony)    │     │  (edge/depth) │     │  + Plant Prompt   │     │  + Metadata  │
└──────────────┘     └──────────────┘     └──────────────────┘     └──────────────┘
                                                    ▲
                                          ┌─────────┴─────────┐
                                          │  Plant Selection   │
                                          │  Engine (filtered  │
                                          │  by user context)  │
                                          └───────────────────┘
```

**Step-by-step:**

1. **Photo Ingestion:** User uploads current balcony photo (or takes one in-app)
2. **Structure Extraction:** ControlNet canny/depth preprocessor extracts balcony geometry — railings, walls, floor, existing furniture
3. **Context Filtering:** Agent queries user's Spatial Context Memory (orientation, zone, light hours) and filters the plant database to only viable species
4. **Style Selection:** User picks from 3-4 aesthetic presets: "Mediterranean Herb Wall," "Tropical Jungle," "Minimalist Zen," "Cottage Wildflower"
5. **Prompt Assembly:** System constructs a detailed img2img prompt combining: structure preservation (ControlNet), selected plants, containers matching user's budget tier, and lighting consistent with their orientation
6. **Generation:** Flux model on fal.ai generates 2-3 variants at 1024×1024
7. **Output Enrichment:** Each render is annotated with: plant list, estimated cost, care difficulty score, and a "tap any plant" overlay linking to care details

**API Choice:** `fal.ai/flux-pro` for img2img with ControlNet support
**Latency Target:** <15 seconds per render
**Cost per render:** ~$0.04 (Flux Pro on fal.ai)

### 4.2 The Bloom Map — Community Balcony Intelligence

**Core Principle:** *Show the vibe, not the view.*

**The Stylization Firewall (Privacy Architecture):**

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  User opts in │────▶│  Metadata        │────▶│  Stylized Sketch │────▶│  Bloom Map  │
│  to share     │     │  Extraction      │     │  Generation      │     │  (public)   │
└──────────────┘     └──────────────────┘     └──────────────────┘     └─────────────┘
                      │ • Plant species       │ Architectural         │ Tagged with:
                      │ • Container types     │ watercolor/line       │ • Postal prefix
                      │ • Color palette       │ sketch generated      │ • Orientation
                      │ • Layout description  │ from metadata ONLY    │ • Plant list
                      │ • NO original photo   │ (not from photo)      │ • Season
                      │   stored for sharing  │                       │
```

**Process Detail:**

1. **Opt-in Flow:** Explicit screen: *"Share a stylized sketch of your garden with nearby gardeners? We never share your photo — we create an artistic interpretation from your plant data."*
2. **Metadata Extraction (server-side):**
   - Vision model identifies: plant species, container types, arrangement pattern
   - Extracts: dominant colors, vertical/horizontal ratio, density score
   - Discards: all background elements, building features, identifying objects
3. **Sketch Generation:**
   - Prompt-based generation (NOT img2img from original): "Architectural watercolor sketch of a balcony garden featuring [extracted plant list] in [container types], [arrangement pattern], warm afternoon light"
   - Style is deliberately artistic and non-photorealistic
4. **Publication:** Sketch + metadata stored with postal code prefix only (e.g., "100xx" for central Berlin, "400xx" for Mumbai West)
5. **Data Retention:** Original photo used only for plant identification, then processed. Never enters the Bloom Map pipeline.

**Legal Compliance:**
- GDPR Art. 6(1)(a): Explicit consent for sharing
- No personal data in shared output (no geolocation beyond postal prefix, no photo)
- Right to withdrawal: user can delete their Bloom Map contributions instantly

### 4.3 Plant Ledger & Swap Agent

**The Plant Ledger** is a per-user structured record of every plant they're growing:

```typescript
interface PlantEntry {
  id: string;
  species: string;              // "Solanum lycopersicum (Cherry Tomato)"
  variety: string;              // "Sweet Million"
  acquired_date: Date;
  container_size_liters: number;
  location_on_balcony: string;  // "left rail, full sun"
  health_timeline: HealthSnapshot[];  // from photo analysis
  harvest_log: HarvestEntry[];
  status: 'active' | 'dormant' | 'deceased' | 'available_for_swap';
}

interface HealthSnapshot {
  date: Date;
  photo_url: string;           // user's private storage
  health_score: number;        // 0-100, AI-assessed
  issues_detected: string[];   // ["early_blight", "nitrogen_deficiency"]
  growth_stage: string;        // "seedling" | "vegetative" | "flowering" | "fruiting"
  height_cm_estimated: number;
}
```

**The Swap Agent — "Verified Plant Twins":**

- When a user marks a plant as `available_for_swap` (mature cuttings, excess seeds, divisions), the agent:
  1. Matches against other users within the same **postal code prefix** who have expressed interest in that species
  2. Verifies "twin compatibility" — both growers are in similar climate conditions
  3. Sends a double-opt-in notification to both parties
  4. Facilitates exchange via anonymous in-app messaging (no personal details shared until both agree)
  5. After swap, both log the new plant → builds provenance chain

**Privacy:** No real names or addresses shared until mutual opt-in. Postal prefix only. Users can set their swap radius.

### 4.4 Proactive Health Monitoring

**Two input streams, one intelligence layer:**

**Stream 1: Weather API Integration**
- Source: OpenWeatherMap free tier (60 calls/min, more than sufficient)
- Monitoring: Daily forecast pull per user location (city-level)
- Triggers:
  - Frost warning (<2°C): "Move your [frost-sensitive plants] indoors tonight"
  - Heatwave (>35°C for 3+ days): Adjusted watering schedule
  - Heavy rain: "Skip watering today, check drainage on [plant X]"
  - High humidity + warm: "Fungal risk elevated — improve airflow around tomatoes"

**Stream 2: Vision-Based Health Analysis**
- Triggered by: user photo uploads (prompted weekly via gentle notification)
- Model: GPT-4o Vision (cost-effective for plant analysis)
- Analysis output: health score, detected issues, growth stage progression
- Comparison: against user's own timeline AND anonymized neighborhood averages

**Intelligence Layer:**
- Combines both streams: "Your tomato's leaf curl matches heat stress patterns we're seeing across 8 growers in your area this week. Here's what worked for them: [specific intervention]"

---

## 5. Technical Architecture — The Cline Blueprint

### 5.1 Stack Selection

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOATGREENS STACK                              │
├──────────────┬──────────────────────────────────────────────────┤
│ Frontend     │ Next.js 14 (App Router) + Tailwind + PWA         │
│ Backend      │ Next.js API Routes + Server Actions               │
│ Database     │ Supabase (Postgres + Auth + Storage + Realtime)   │
│ AI Orchestr. │ Vercel AI SDK (useChat, useCompletion, tools)     │
│ LLM          │ Claude 3.5 Sonnet (agentic reasoning)            │
│              │ GPT-4o-mini (vision analysis, cheap bulk tasks)   │
│ Image Gen    │ fal.ai (Flux Pro img2img + ControlNet)           │
│ Weather      │ OpenWeatherMap API (free tier)                    │
│ Hosting      │ Vercel (hobby → pro as needed)                   │
│ Cron Jobs    │ Vercel Cron (weather checks, notifications)       │
│ Notifications│ Web Push API (PWA) + email via Resend             │
└──────────────┴──────────────────────────────────────────────────┘
```

### 5.2 Data Architecture (Supabase Schema)

```sql
-- Core tables (simplified)

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  postal_code_prefix TEXT,        -- first 3-4 digits only
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE balconies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT DEFAULT 'My Balcony',
  orientation TEXT,                -- 'N', 'NE', 'E', etc.
  dimensions_m2 DECIMAL,
  floor_level INTEGER,
  sun_hours_estimated DECIMAL,
  climate_zone TEXT,
  wind_exposure TEXT,              -- 'sheltered', 'moderate', 'exposed'
  photo_url TEXT,                  -- private, in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balcony_id UUID REFERENCES balconies(id),
  species TEXT NOT NULL,
  variety TEXT,
  nickname TEXT,
  container_size_liters DECIMAL,
  position_description TEXT,
  acquired_date DATE,
  status TEXT DEFAULT 'active',
  swap_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  photo_url TEXT,
  health_score INTEGER,           -- 0-100
  issues_detected JSONB,
  growth_stage TEXT,
  ai_analysis TEXT,               -- full LLM response cached
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bloom_map_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  postal_prefix TEXT,
  orientation TEXT,
  plant_species TEXT[],
  style_tags TEXT[],
  sketch_url TEXT,                -- AI-generated stylized sketch
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action_type TEXT,               -- 'weather_alert', 'health_check', 'swap_match', etc.
  payload JSONB,
  status TEXT DEFAULT 'pending',  -- 'pending', 'delivered', 'acted_on', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.3 The Agent Loop (Agentic Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    FLOATGREENS AGENT LOOP                       │
│                                                           │
│  ┌───────────┐    ┌────────────────┐    ┌────────────┐  │
│  │  TRIGGERS  │───▶│  CONTEXT       │───▶│  REASONING │  │
│  │            │    │  ASSEMBLY      │    │  (LLM)     │  │
│  │• Cron (6h) │    │                │    │            │  │
│  │• Photo up  │    │• User profile  │    │• Tool calls│  │
│  │• Weather Δ │    │• Balcony data  │    │• Action    │  │
│  │• User msg  │    │• Plant ledger  │    │  planning  │  │
│  │• Swap match│    │• Health history│    │            │  │
│  └───────────┘    │• Local weather │    └─────┬──────┘  │
│                    │• Neighborhood  │          │          │
│                    │  growth data   │    ┌─────▼──────┐  │
│                    └────────────────┘    │  ACTIONS    │  │
│                                          │             │  │
│                                          │• Push notif │  │
│                                          │• Schedule   │  │
│                                          │• Generate   │  │
│                                          │  image      │  │
│                                          │• Update     │  │
│                                          │  ledger     │  │
│                                          │• Draft swap │  │
│                                          └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Vercel AI SDK Tool Definitions (Weekend Build Priority):**

```typescript
const verdaTools = {
  // P0 — Weekend MVP
  analyzePhoto: tool({
    description: 'Analyze a plant/balcony photo for health, species ID, or layout',
    parameters: z.object({ photoUrl: z.string(), analysisType: z.enum(['health', 'species', 'layout']) }),
    execute: async ({ photoUrl, analysisType }) => { /* GPT-4o-mini vision call */ }
  }),

  getWeatherForecast: tool({
    description: 'Get weather forecast for user location',
    parameters: z.object({ city: z.string(), days: z.number().max(5) }),
    execute: async ({ city, days }) => { /* OpenWeatherMap API */ }
  }),

  generateDreamRender: tool({
    description: 'Generate a dream balcony render from user photo',
    parameters: z.object({ photoUrl: z.string(), style: z.string(), plantList: z.array(z.string()) }),
    execute: async ({ photoUrl, style, plantList }) => { /* fal.ai Flux img2img */ }
  }),

  queryPlantLedger: tool({
    description: 'Query user plant inventory and health history',
    parameters: z.object({ userId: z.string(), filter: z.string().optional() }),
    execute: async ({ userId, filter }) => { /* Supabase query */ }
  }),

  // P1 — Week 2
  generateBloomSketch: tool({ /* ... */ }),
  findSwapMatches: tool({ /* ... */ }),
  createWateringSchedule: tool({ /* ... */ }),
};
```

### 5.4 The Compounding Moat: The Green Graph

```
                    ┌─────────────────────────┐
                    │      THE GREEN GRAPH      │
                    └─────────┬───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼──────┐ ┌─────▼──────┐ ┌──────▼────────┐
    │  SPATIAL LAYER  │ │ TEMPORAL   │ │  COMMUNITY    │
    │                 │ │ LAYER      │ │  LAYER        │
    │ • Orientation   │ │ • Season   │ │ • Postal zone │
    │ • Sun hours     │ │ • Growth   │ │ • Success     │
    │ • Wind          │ │   curves   │ │   rates       │
    │ • Floor level   │ │ • Harvest  │ │ • Common      │
    │ • Container     │ │   dates    │ │   issues      │
    │   sizes         │ │ • Failure  │ │ • Swap        │
    │                 │ │   points   │ │   network     │
    └────────┬────────┘ └─────┬──────┘ └──────┬────────┘
             │                │               │
             └────────────────┼───────────────┘
                              │
                    ┌─────────▼───────────────┐
                    │   INFERENCE ENGINE        │
                    │                           │
                    │ "Cherry tomatoes in 15L   │
                    │  containers on east-facing │
                    │  Mumbai balconies above    │
                    │  floor 4 yield 23% less    │
                    │  than floor 2 — likely     │
                    │  wind stress. Recommend    │
                    │  wind barrier or switch    │
                    │  to determinate variety."  │
                    └───────────────────────────┘
```

**How it compounds:**
- **User 1-10:** Agent uses general botanical knowledge + user's spatial context
- **User 10-100:** Agent notices patterns across similar setups in same city
- **User 100-1000:** Agent can predict success probability for specific plant × location × season combinations
- **User 1000+:** Agent becomes the authoritative source for hyperlocal urban gardening intelligence — data no LLM training set contains

**Implementation (Weekend):** Start with Supabase aggregate queries. No ML needed initially — the LLM can reason over structured data summaries:

```sql
-- Example: "What works in this user's conditions?"
SELECT species, variety,
       AVG(health_score) as avg_health,
       COUNT(*) as grower_count
FROM plants p
JOIN health_snapshots h ON p.id = h.plant_id
JOIN balconies b ON p.balcony_id = b.id
WHERE b.orientation = $1
  AND b.climate_zone = $2
  AND b.postal_code_prefix LIKE $3
GROUP BY species, variety
HAVING COUNT(*) >= 3
ORDER BY avg_health DESC;
```

This query result gets injected into the agent's context. Simple, powerful, weekend-buildable.

---

## 6. Constraint Management & Unit Economics

### 6.1 Cost Breakdown: 5 Power Users, $100/mo Budget

| Service | Usage Assumption | Unit Cost | Monthly Cost |
|---------|-----------------|-----------|-------------|
| **Claude 3.5 Sonnet** (agentic reasoning) | 5 users × 30 conversations × ~2K tokens avg | $3/MTok in, $15/MTok out | **~$12** |
| **GPT-4o-mini** (vision analysis) | 5 users × 20 photo analyses × ~1K tokens | $0.15/MTok in, $0.60/MTok out | **~$2** |
| **fal.ai Flux Pro** (dream renders) | 5 users × 8 renders/mo | ~$0.04/image | **~$1.60** |
| **fal.ai Flux** (bloom sketches) | 5 users × 2 sketches/mo | ~$0.03/image | **~$0.30** |
| **Supabase** (DB + Auth + Storage) | Free tier (500MB DB, 1GB storage) | $0 | **$0** |
| **Vercel** (hosting + cron) | Hobby tier sufficient for 5 users | $0 | **$0** |
| **OpenWeatherMap** | Free tier (1000 calls/day) | $0 | **$0** |
| **Resend** (email notifications) | Free tier (100 emails/day) | $0 | **$0** |
| **Domain** | .app or .garden | ~$1/mo amortized | **~$1** |
| | | **TOTAL** | **~$17/mo** |

**Buffer for spikes:** Even at 3× usage assumptions, we're at **~$51/mo**. The $100 ceiling gives us **5.8× headroom**.

### 6.2 Cost Optimization Strategies

1. **Aggressive caching:** Cache weather data (refresh every 6 hours, not per-request). Cache plant analysis results permanently.
2. **Tiered model usage:** Use GPT-4o-mini for all vision tasks (it's excellent at plant identification). Reserve Claude Sonnet for complex agentic reasoning only.
3. **Prompt engineering:** Pre-compute "context summaries" for each user rather than stuffing full history into every prompt. One daily batch job summarizes → saves 60%+ tokens.
4. **Image generation batching:** Generate dream renders off-peak; no real-time requirement for this feature.

### 6.3 Weekend Build Prioritization

```
┌─────────────────────────────────────────────────────────────┐
│                   WEEKEND BUILD PLAN                         │
├────────────┬────────────────────────────────────────────────┤
│ SATURDAY   │                                                │
│ Morning    │ Scaffold: Next.js + Supabase + Auth            │
│ (4h)       │ DB schema + Supabase Storage buckets           │
│            │ Basic UI: onboarding flow (3 photos + compass) │
├────────────┼────────────────────────────────────────────────┤
│ SATURDAY   │ Agent core: Vercel AI SDK + Claude integration │
│ Afternoon  │ Tool: analyzePhoto (GPT-4o-mini vision)        │
│ (4h)       │ Tool: getWeatherForecast (OpenWeatherMap)      │
│            │ Plant Ledger CRUD                               │
├────────────┼────────────────────────────────────────────────┤
│ SATURDAY   │ Tool: generateDreamRender (fal.ai)             │
│ Evening    │ Photo → Render pipeline (basic, no ControlNet  │
│ (3h)       │ — just img2img with strong prompt)             │
├────────────┼────────────────────────────────────────────────┤
│ SUNDAY     │ Proactive agent: Vercel Cron → weather check   │
│ Morning    │ → per-user alert generation                    │
│ (4h)       │ Push notification setup (Web Push API)         │
├────────────┼────────────────────────────────────────────────┤
│ SUNDAY     │ Bloom Map v0: simple grid of stylized entries  │
│ Afternoon  │ (hard-code stylization prompt, no ControlNet)  │
│ (3h)       │ Swap Agent: basic matching query + notification│
├────────────┼────────────────────────────────────────────────┤
│ SUNDAY     │ Polish: PWA manifest, mobile responsiveness    │
│ Evening    │ Onboarding UX, error handling, deploy to Vercel│
│ (2h)       │                                                │
└────────────┴────────────────────────────────────────────────┘
                         TOTAL: ~20 hours
```

**What's CUT from weekend (deferred to Week 2-4):**
- ControlNet integration (use basic img2img instead)
- Sophisticated swap matching algorithm (use simple postal prefix + species match)
- Growth curve analytics dashboard
- Calendar integration for travel detection
- Neighborhood aggregate intelligence (needs users first)

---

## 7. Success Metrics & Future Roadmap

### 7.1 Success Metrics

**North Star Metric:** *Weekly Active Agent Interactions* (not DAU — gardening is a weekly rhythm)

| Category | Metric | MVP Target (Month 1) | Scale Target (Month 6) |
|----------|--------|----------------------|------------------------|
| **Activation** | Onboarding completion (photo + compass + 1 plant) | 80% of signups | 85% |
| **Engagement** | Weekly photo uploads per active user | 2+ | 4+ |
| **Value Delivery** | Agent-initiated actions acted upon | 40% | 60% |
| **Retention** | 4-week retention | 50% | 65% |
| **Community** | Bloom Map opt-in rate | 30% | 50% |
| **Growth** | Organic referrals (invite-triggered signups) | 0.3 per user/mo | 0.8 per user/mo |
| **Health Outcome** | Plant survival rate (user-reported) | 60% → 75% | 85%+ |
| **Moat** | Green Graph data points per postal zone | 50 | 5,000 |

### 7.2 Roadmap

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FLOATGREENS ROADMAP                                │
├──────────┬───────────────────────────────────────────────────────────┤
│ WEEKEND  │ MVP Launch                                                │
│          │ • Chat agent with spatial context                         │
│          │ • Photo analysis (health + species ID)                    │
│          │ • Dream Balcony renders (basic img2img)                   │
│          │ • Weather-triggered watering alerts                       │
│          │ • Plant Ledger CRUD                                       │
├──────────┼───────────────────────────────────────────────────────────┤
│ MONTH 1  │ Community Foundation                                      │
│          │ • Bloom Map v1 with stylization pipeline                  │
│          │ • Swap Agent with double opt-in                           │
│          │ • ControlNet integration for better renders               │
│          │ • Weekly health report (automated photo prompt → analysis)│
├──────────┼───────────────────────────────────────────────────────────┤
│ MONTH 3  │ Intelligence Layer                                        │
│          │ • Green Graph v1: neighborhood success aggregation        │
│          │ • Seasonal rotation planning agent                        │
│          │ • Growth curve visualization (plant timeline)             │
│          │ • "What should I grow?" recommendation engine             │
├──────────┼───────────────────────────────────────────────────────────┤
│ MONTH 6  │ Platform Expansion                                        │
│          │ • IoT integration (soil moisture sensors → agent input)   │
│          │ • Nursery/seed vendor partnerships (affiliate model)      │
│          │ • Seasonal challenges ("Grow-along" community events)     │
│          │ • Multilingual support (Hindi, German, Spanish, Japanese) │
├──────────┼───────────────────────────────────────────────────────────┤
│ MONTH 12 │ Monetization & Scale                                      │
│          │ • Freemium: Free (2 plants) → Pro $5/mo (unlimited)      │
│          │ • B2B: Anonymized urban agriculture insights for cities   │
│          │ • Marketplace: Verified local plant/supply swaps          │
│          │ • API: "Green Graph" data access for researchers          │
└──────────┴───────────────────────────────────────────────────────────┘
```

### 7.3 The Endgame Vision

FloatGreens's terminal state is not an app — it's an **urban agriculture intelligence network**. Every balcony photo, every harvest log, every failed seedling is a data point in a growing understanding of how food and beauty can thrive in cities. The agent gets smarter with every user, every season, every postal code.

By the time a large platform considers building this, FloatGreens's Green Graph will contain millions of hyperlocal plant-outcome observations that cannot be synthesized from satellite imagery or academic papers. It can only come from the hands and phone cameras of people who care about their 3 square meters of green.

That's the moat. Not code. Not models. **Lived botanical truth, structured and compounding.**

---

*Document Status: Ready for Engineering Kickoff*
*Next Action: Open Cline, scaffold Next.js project, begin Saturday morning sprint.*

---

> *"The best time to plant a tree was 20 years ago. The second best time is this weekend, with an AI agent watching over it."*