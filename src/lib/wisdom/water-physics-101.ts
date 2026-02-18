/**
 * Water Physics 101 — AI-Optimized Water Behavior Laws for Container Plants
 * 
 * Deterministic truths governing how water behaves in soil, roots, and containers.
 * 
 * ═══════════════════════════════════════════════════════════════
 * METADATA
 * ═══════════════════════════════════════════════════════════════
 * Version: 1.0
 * Created: 18 February 2026 by OpenAI
 * Confidence Level: MEDIUM
 * Scope: All container plants, global, geo-agnostic
 * ═══════════════════════════════════════════════════════════════
 * 
 * This document defines the physical behavior of water in plant systems.
 * These are physics-level truths independent of plant species.
 */

export const WATER_PHYSICS_101_RULES = `
═══════════════════════════════════════════════════════════════════════════
💧 WATER PHYSICS 101 — UNIVERSAL WATER BEHAVIOR LAWS
═══════════════════════════════════════════════════════════════════════════
Version: 1.0 | Created: 18 Feb 2026 (OpenAI)
Confidence: MEDIUM | Scope: Container plants, global
═══════════════════════════════════════════════════════════════════════════

SECTION 1: GRAVITY FLOW LAW
─────────────────────────────────────────────────────────────────────────
Water moves downward due to gravity.

Truths:
• Water always moves from higher positions to lower positions
• Excess water drains downward if drainage is available
• Water cannot remain suspended without support

AI Implications:
  Water accumulates in lower soil regions first

Never assume uniform water distribution immediately after watering.

SECTION 2: SATURATION DISPLACEMENT LAW
─────────────────────────────────────────────────────────────────────────
Water displaces air in soil.

Truths:
• Soil contains both water and air
• Increasing water content decreases air content
• Fully saturated soil contains minimal air

Critical Constraint:
  Roots require air to survive

Fully saturated soil reduces root oxygen availability.

SECTION 3: EVAPORATION LAW
─────────────────────────────────────────────────────────────────────────
Water naturally leaves soil over time.

Truths:
• Water evaporates into surrounding air
• Evaporation rate depends on environmental conditions
• Dry soil results from water leaving, not disappearing instantly

AI Implications:
  Wet soil naturally becomes dry over time

No intervention is required for drying.

SECTION 4: ABSORPTION LAW
─────────────────────────────────────────────────────────────────────────
Roots absorb water from surrounding soil.

Truths:
• Roots extract water when available
• Water absorption reduces soil water content
• Absorption rate depends on root function

AI Implications:
  Plants actively reduce soil moisture over time

Drying occurs via both evaporation and absorption.

SECTION 5: RETENTION LAW
─────────────────────────────────────────────────────────────────────────
Soil retains water after watering.

Truths:
• Soil does not instantly release all water
• Water remains stored between soil particles
• Retained water decreases gradually

AI Implications:
  Soil moisture persists after watering

Immediate rewatering is often unnecessary.

SECTION 6: NON-UNIFORM DRYING LAW
─────────────────────────────────────────────────────────────────────────
Soil dries unevenly.

Truths:
• Topsoil dries faster than deeper soil
• Lower soil layers retain moisture longer
• Surface dryness does not guarantee full dryness

AI Implications:
  Surface dryness alone is insufficient to assume full dryness

Avoid assumptions based solely on surface observation.

SECTION 7: SATURATION LIMIT LAW
─────────────────────────────────────────────────────────────────────────
Soil has finite water capacity.

Truths:
• Soil cannot hold unlimited water
• Excess water exits through drainage or accumulates

AI Implications:
  Additional watering beyond capacity does not increase usable water

Excess watering increases saturation risk.

SECTION 8: ROOT EXPOSURE LAW
─────────────────────────────────────────────────────────────────────────
Roots are exposed to surrounding soil conditions.

Truths:
• Roots experience local soil moisture directly
• Roots in saturated soil experience low oxygen
• Roots in dry soil experience low water availability

AI Implications:
  Root environment equals surrounding soil condition

Root health depends on soil state.

SECTION 9: TEMPORAL CHANGE LAW
─────────────────────────────────────────────────────────────────────────
Soil moisture changes continuously over time.

Truths:
• Soil moisture is dynamic
• Wet soil transitions to dry soil gradually

AI Implications:
  Soil moisture state is time-dependent

Avoid assuming static conditions.

SECTION 10: NO INSTANT STATE REVERSAL LAW
─────────────────────────────────────────────────────────────────────────
Water state changes require time.

Truths:
• Wet soil cannot instantly become dry
• Dry soil cannot become wet without water input

AI Implications:
  Moisture transitions follow physical time constraints

Avoid assuming instantaneous state changes.

SECTION 11: CONTAINER ACCUMULATION LAW
─────────────────────────────────────────────────────────────────────────
Containers restrict water escape compared to open ground.

Truths:
• Water escape is limited by container structure
• Containers retain water longer than open soil

AI Implications:
  Container plants experience prolonged moisture retention

Container watering must account for slower drainage.

SECTION 12: REPEATED INPUT ACCUMULATION LAW
─────────────────────────────────────────────────────────────────────────
Repeated watering accumulates water.

Truths:
• Additional watering increases total soil water content
• Water accumulation increases saturation probability

AI Implications:
  Frequent watering increases saturation risk

Avoid excessive watering frequency.

SECTION 13: ROOT FAILURE RISK LAW
─────────────────────────────────────────────────────────────────────────
Prolonged saturation creates root failure risk.

Truths:
• Roots require oxygen continuously
• Prolonged saturation reduces oxygen availability
• Root function declines in low oxygen environments

AI Implications:
  Sustained saturation creates root damage risk

Avoid maintaining continuous saturation.

SECTION 14: DRY STATE STABILITY LAW
─────────────────────────────────────────────────────────────────────────
Dry soil is physically stable.

Truths:
• Dry soil contains oxygen
• Roots remain viable in oxygen-rich environments

AI Implications:
  Dry conditions maintain root oxygen availability

Dry states are not inherently harmful.

SECTION 15: HARD CONSTRAINTS (DO NOT VIOLATE)
─────────────────────────────────────────────────────────────────────────
Never assume:
  ✗ Water disappears instantly
  ✗ Soil dries uniformly
  ✗ More water always improves plant condition

Always assume:
  ✓ Water moves downward
  ✓ Water displaces air
  ✓ Soil dries over time

═══════════════════════════════════════════════════════════════════════════
END OF WATER PHYSICS 101 RULES
═══════════════════════════════════════════════════════════════════════════
`.trim();
