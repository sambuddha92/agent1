# Agent Consistency Layer

## Overview

The Agent Consistency Layer ensures that FloatGreens maintains a uniform voice, tone, and style across all AI models, regardless of which backend model (Nova Pro, Nova Lite, Claude Haiku, Claude Sonnet) is handling the conversation.

## The Problem

When using multiple AI models with different capabilities and personalities:
- **Nova models** tend to be more formal, verbose, and apologetic
- **Claude Sonnet** provides thorough, explanatory responses with caveats
- **Claude Haiku** is balanced and concise
- **Nova Lite** can be brief and generic

Without a consistency layer, users experience jarring shifts in conversation tone when the model routing switches between tiers, damaging the perceived quality and trustworthiness of the agent.

## The Solution

A three-pronged approach to maintain consistency:

### 1. **Pre-Processing: Model-Specific Prompt Enhancement**
Each model receives tailored instructions based on its known behavioral tendencies:

```typescript
// Example: Nova Pro gets directness boost
'CRITICAL: Be MORE concise. Cut fluff. No apologies. Lead with action.'

// Example: Nova Lite gets warmth injection  
'CRITICAL: Add warmth and personality. Be specific, not generic.'
```

### 2. **Voice Guidelines Injection**
A mandatory voice consistency block is prepended to every system prompt:

- **Tone Calibration**: Warmth (8/10), Expertise (7/10), Directness (8/10), Empathy (9/10)
- **Style Rules**: Lead with action, max 2 emojis, use bullet points, concise responses
- **Language Patterns**: Preferred phrases to use and avoid
- **Consistency Checklist**: 6-point verification before responding

### 3. **Post-Processing: Response Normalization**
After the model generates a response, it's automatically cleaned:

- Remove unnecessary apologies ("I'm sorry but...")
- Strip AI self-references ("As an AI...")
- Reduce excessive hedging ("I think maybe possibly...")
- Replace overly formal language ("utilize" → "use")
- Fix generic openings ("Sure! Certainly!")

## Architecture

```
User Input
    ↓
[Model Router] ← Selects optimal model (T1/T2/T3)
    ↓
[Prompt Enhancement] ← Adds consistency layer + model-specific adjustments
    ↓
[AI Model] ← Generates response
    ↓
[Response Normalization] ← Removes style violations
    ↓
[Consistency Metrics] ← Logs quality score
    ↓
User Output
```

## Implementation

### Core Files

1. **`src/lib/ai/consistency.ts`** - Main consistency layer logic
2. **`src/app/api/chat/route.ts`** - Integration point in chat API

### Key Functions

#### `enhancePromptWithConsistency(systemPrompt, modelId, voiceProfile?)`
Enhances the system prompt with voice consistency guidelines tailored to the specific model.

```typescript
// Before sending to model
const systemPrompt = enhancePromptWithConsistency(basePrompt, modelId);
```

#### `enforceConsistency(response, modelId, tier)`
Post-processes model response to fix style violations and ensure consistency.

```typescript
// After receiving from model
const normalizedResponse = enforceConsistency(rawResponse, modelId, tier);
```

#### `analyzeResponseConsistency(response)`
Calculates consistency metrics (0-100 score) for monitoring.

## Voice Guidelines

### The FloatGreens Voice Profile

```typescript
{
  warmth: 8,           // Friendly and approachable
  professionalism: 7,  // Expert but not stuffy
  playfulness: 5,      // Occasional wit, not overdone
  directness: 8,       // Get to the point
  empathy: 9,          // Deeply caring about user's success
}
```

### Style Constraints

- **Max 2 emojis** per response
- **Max 1 pun/joke** per response (if any)
- **Lead with action/answer** - no generic pleasantries
- **Use bullet points** for lists of 2+ items
- **Response length**: <150 words (concise mode)

### Preferred Phrases

✓ "Let's check..."
✓ "Here's what I see..."
✓ "Your plants will thank you..."
✓ "I'd recommend..."
✓ "Watch out for..."
✓ "Quick tip..."

### Avoided Phrases

✗ "I'm sorry but..."
✗ "I apologize..."
✗ "I'm just an AI..."
✗ "As an AI..."
✗ "In my opinion..."

## Monitoring & Observability

### Consistency Score (0-100)

The system automatically calculates a consistency score for each response:

- **100**: Perfect consistency
- **80-99**: Good consistency
- **70-79**: Acceptable with minor issues
- **<70**: Poor consistency (logged as warning)

### Deductions

- **-30**: AI self-reference detected
- **-25**: Unnecessary apologies
- **-20**: Doesn't lead with action
- **-15**: Wrong formality level or excessive emojis
- **-10**: Too verbose (>250 words) or missing bullet points

### Console Logs

```bash
[consistency] model=amazon.nova-pro-v1:0 tier=T1 score=85
[consistency] Applied 2 style corrections to response
[consistency] violations detected: unnecessary_apology, generic_opening
```

## Customization

### Adjusting Voice Profile

You can override the default voice profile per request:

```typescript
const customVoice: VoiceProfile = {
  energy: 'enthusiastic',
  formality: 'casual',
  verbosity: 'detailed',
  humor: 'playful',
};

const prompt = enhancePromptWithConsistency(
  basePrompt, 
  modelId, 
  customVoice
);
```

### Adding New Style Violations

Edit `STYLE_VIOLATIONS` array in `consistency.ts`:

```typescript
{
  pattern: /your regex here/gi,
  issue: 'descriptive_name',
  replacement: 'fixed version',
  severity: 'high' | 'medium' | 'low',
}
```

### Model-Specific Adjustments

Add new models to `MODEL_BEHAVIORS` object:

```typescript
'your-new-model-id': {
  tendencies: ['verbose', 'formal'],
  compensation: 'increase_directness',
  styleAdjustment: 'CRITICAL: Your specific instruction here.',
}
```

## Testing

### Manual Testing Checklist

Test the same prompt across different tiers to verify consistency:

1. **Greeting Test**: "Hi, how are you?"
   - Should be brief across all models
   - T1 (Nova Lite) should sound as warm as T3 (Sonnet)

2. **Diagnostic Test**: "Why are my basil leaves turning yellow?"
   - Should lead with diagnosis, not pleasantries
   - Similar structure across T2/T3

3. **Complex Planning**: "Design my entire balcony garden"
   - T3 should be detailed but not overly apologetic
   - Should maintain consistent energy level

### Expected Behavior

**Before Consistency Layer:**
- Nova: "I apologize for any confusion. I'd be happy to assist you with..."
- Claude: "Sure! That's a great question. Let me explain..."

**After Consistency Layer:**
- All models: "Your basil has nitrogen deficiency. Here's what to do..."

## Integration with Existing Systems

### Works With

✓ **SOUL Layer** (`soul.ts`) - Consistency is applied after SOUL
✓ **Personalization** (`personalized-prompts.ts`) - Maintains learned preferences
✓ **Model Router** (`model-router.ts`) - Applied to all tier selections
✓ **Memory System** - Doesn't interfere with context injection

### Prompt Layering Order

```
1. SOUL (immutable identity)
    ↓
2. System Prompt (behavior)
    ↓
3. Personalization (adaptive)
    ↓
4. User Context (ephemeral)
    ↓
5. CONSISTENCY LAYER ← Added here
    ↓
6. AI Model
    ↓
7. Response Normalization ← Applied here
```

## Performance Impact

- **Latency**: +5-10ms (prompt enhancement + post-processing)
- **Token Usage**: +200-300 tokens per request (consistency block)
- **Benefit**: Significantly improved user experience and trust

**Trade-off**: The small cost in tokens is justified by the substantial improvement in perceived quality and consistency.

## Future Enhancements

### Planned Features

1. **Dynamic Adjustment Learning**
   - Learn which models drift most over time
   - Auto-adjust compensation strength

2. **User-Specific Voice Profiles**
   - Store preferred voice settings per user
   - "I prefer detailed explanations" → adjusts verbosity

3. **A/B Testing Framework**
   - Compare consistency scores with/without layer
   - Measure user satisfaction impact

4. **Advanced Metrics**
   - Sentiment consistency analysis
   - Vocabulary consistency tracking
   - Response structure similarity

## Troubleshooting

### Issue: Model still sounds inconsistent

**Solution**: Check model-specific adjustments. You may need to strengthen instructions:

```typescript
// Increase directness
styleAdjustment: 'CRITICAL: Be MUCH MORE concise. NO apologies. Lead with ACTION.'
```

### Issue: Post-processing removes too much

**Solution**: Adjust severity thresholds or disable specific violations:

```typescript
// Make less aggressive
{
  pattern: /pattern/,
  severity: 'low', // Changed from 'high'
}
```

### Issue: Consistency score always low

**Solution**: Review violations in logs. Adjust scoring thresholds in `analyzeResponseConsistency()`.

## Best Practices

1. **Monitor Logs**: Regularly review consistency scores to identify drift
2. **Test New Models**: Always test consistency when adding new models
3. **Update Guidelines**: Keep voice guidelines aligned with brand evolution
4. **Balance Enforcement**: Don't over-correct; maintain model strengths
5. **User Feedback**: Collect feedback on consistency across conversations

## Metrics Dashboard (Future)

Planned dashboard to track:
- Average consistency score by model
- Most common violations by model
- Response time impact
- User satisfaction correlation

## Summary

The Agent Consistency Layer ensures FloatGreens sounds like **one expert**, not a committee of different personalities. By combining model-specific prompt engineering with post-processing normalization, we maintain a consistent, trustworthy voice that users can rely on - regardless of which AI model is working behind the scenes.

**Result**: Users get the same warm, expert, concise FloatGreens experience whether they're asking a simple question (Nova Lite/T1) or planning a complete garden redesign (Claude Sonnet/T3).
