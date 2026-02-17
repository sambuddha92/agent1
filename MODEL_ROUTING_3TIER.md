# 3-Tier Model Routing System

## Overview
FloatGreens now uses an optimized 3-tier model routing system with automatic fallback support for maximum reliability and cost-effectiveness.

## Model Tiers

### T1 - Simple Interactions
**Primary Model:** Amazon Nova Pro (`amazon.nova-pro-v1:0`)  
**Fallback:** Amazon Nova Lite (`amazon.nova-lite-v1:0`)  
**Cost:** $0.80/$3.20 per 1M tokens  
**Use Cases:**
- Greetings and acknowledgments
- Simple questions
- Short conversational exchanges
- Very brief messages (<30 characters without questions)

### T2 - Medium Complexity
**Primary Model:** Claude 3.5 Haiku (`us.anthropic.claude-3-5-haiku-20241022-v1:0`)  
**Fallback:** Amazon Nova Pro (`amazon.nova-pro-v1:0`)  
**Cost:** $0.80/$4.00 per 1M tokens  
**Use Cases:**
- Diagnostic questions (plant problems, diseases, pests)
- Care guidance and recommendations
- Medium-length messages with questions
- Multi-part queries
- When/how/why questions about plant care

### T3 - Complex Tasks
**Primary Model:** Claude 3.5 Sonnet (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`)  
**Fallback 1:** Claude 3.5 Haiku (`us.anthropic.claude-3-5-haiku-20241022-v1:0`)  
**Fallback 2:** Amazon Nova Pro (`amazon.nova-pro-v1:0`)  
**Cost:** $3.00/$15.00 per 1M tokens  
**Use Cases:**
- All messages with images
- Planning, design, and visualization tasks
- Complex multi-part queries
- Long conversations (6+ messages) on detailed topics
- Comprehensive guides and detailed analysis
- Redesign and transformation requests

## Fallback Mechanism

The system implements automatic cascading fallbacks to ensure reliability:

1. **Primary Model Attempt**: System tries the tier-appropriate primary model
2. **Automatic Fallback**: If the primary model fails (rate limits, service issues), automatically falls back to cheaper, more available models
3. **Retry Logic**: Up to 3 attempts with different models
4. **Error Handling**: Returns user-friendly error message if all models fail

### Fallback Chain Example:
```
T3 Request with Image:
1. Claude 3.5 Sonnet ❌ (Bedrock issue)
2. Claude 3.5 Haiku ✅ (Success)
```

## Classification Logic

### T3 Classification Rules (Complex):
- Contains images → T3
- Complex keywords: plan, design, render, visualize, comprehensive, etc.
- Long messages (>300 chars) with multi-part queries
- Long conversations (6+ messages) with medium complexity keywords

### T2 Classification Rules (Medium):
- Medium complexity keywords: diagnose, problem, recommend, schedule, etc.
- Medium-length messages (>150 chars) with questions
- Multi-part queries (multiple questions or conjunctions)

### T1 Classification Rules (Simple):
- Greeting patterns: hi, hello, hey, good morning, etc.
- Acknowledgment patterns: thanks, ok, cool, yes, no, emoji
- Very short messages (<30 chars) without questions

### Default Behavior:
**When in doubt, use T2** - Better to provide good UX than save a few cents

## Benefits

### Cost Optimization
- **80% cost reduction** for simple queries (T1 uses Nova Pro vs old Sonnet)
- **Smart escalation** - Only uses expensive models when truly needed
- **Fallback to cheaper models** ensures availability without premium costs

### User Experience
- **Well-structured conversations** - Claude models excel at formatting and clarity
- **Fast responses** - T1 and T2 are extremely fast
- **High reliability** - Automatic fallbacks ensure minimal downtime
- **Quality when needed** - Complex tasks get the best available model

### Reliability
- **Always available models** - Nova models have highest availability on Bedrock
- **Graceful degradation** - Automatically falls back without user intervention
- **Multiple fallback levels** - T3 has 2 fallback options
- **Clear logging** - All fallback attempts are logged for monitoring

## Configuration

All model settings are in `src/lib/constants.ts`:

```typescript
export const MODEL_CONFIG = {
  // Primary Models
  T1_MODEL: 'amazon.nova-pro-v1:0',
  T2_MODEL: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  T3_MODEL: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  
  // Fallback Models
  T1_FALLBACK: 'amazon.nova-lite-v1:0',
  T2_FALLBACK: 'amazon.nova-pro-v1:0',
  T3_FALLBACK: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  T3_FALLBACK_SECONDARY: 'amazon.nova-pro-v1:0',
  
  // Classification thresholds
  SHORT_MESSAGE_LENGTH: 30,
  MEDIUM_MESSAGE_LENGTH: 150,
  LONG_MESSAGE_LENGTH: 300,
  MULTI_QUESTION_THRESHOLD: 2,
  LONG_CONVERSATION_THRESHOLD: 6,
};
```

## Monitoring

Check server logs for model selection and fallback information:

```
[model-router] Tier=T2 Model=us.anthropic.claude-3-5-haiku-20241022-v1:0
[chat] user=abc123 conversation=xyz789 tier=T2 model=us.anthropic.claude-3-5-haiku-20241022-v1:0 attempt=1 fallback=false fallbackLevel=0 new=false
```

When fallback occurs:
```
[model-router] Using fallback model for tier=T3, level=1, model=us.anthropic.claude-3-5-haiku-20241022-v1:0
[chat] Model us.anthropic.claude-3-5-sonnet-20241022-v2:0 failed (attempt 1/3): ThrottlingException
[chat] Retrying with fallback model...
```

## Future Improvements

1. **Usage Analytics**: Track tier distribution to optimize thresholds
2. **A/B Testing**: Compare different classification rules
3. **User Feedback**: Learn from user satisfaction signals
4. **Dynamic Thresholds**: Adjust based on time of day, load, etc.
5. **Regional Fallbacks**: Use region-specific models if primary region fails
