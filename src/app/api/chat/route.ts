import { createClient } from '@/lib/supabase/server';
import { analyzeImage } from '@/lib/ai/image-analysis';
import { selectModel } from '@/lib/ai/model-router';
import { resolveModel, resolveUserTier, parseModelPreference } from '@/lib/ai/model-resolver';
import { uploadImage } from '@/lib/supabase/image-storage';
import { createConversation, saveMessage, generateTitle } from '@/lib/conversations';
import { FLOATGREENS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { buildWisdomContext } from '@/lib/wisdom';
import { chatRequestSchema, validateAndFormat } from '@/lib/validation';
import { chatRateLimiter } from '@/lib/rate-limit';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import type { MessageContent } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const formData = await request.formData();

    // Extract and validate input using Zod schema
    const message = formData.get('message') as string | null;
    const images = formData.getAll('images') as File[];
    const conversationId = formData.get('conversationId') as string | null;

    // Extract model preference from FormData (defaults to 'auto' if absent)
    const rawModelPreference = formData.get('modelPreference') as string | null;
    const modelPreference = parseModelPreference(rawModelPreference);

    // Validate request data (use first image for schema validation if exists)
    const validation = validateAndFormat(chatRequestSchema, {
      message: message || '',
      image: images.length > 0 ? images[0] : undefined,
      conversationId: conversationId || undefined,
    });

    if (!validation.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = (validation as any).errors;
      console.warn('[POST /api/chat] Validation failed:', errors);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit for this user
    const rateLimitExceeded = !chatRateLimiter.check(user.id);
    if (rateLimitExceeded) {
      console.warn('[POST /api/chat] Rate limit exceeded for user:', user.id);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please try again in a moment',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
          },
        }
      );
    }

    // Resolve user tier from metadata (free by default — future billing hook)
    const userTier = resolveUserTier(
      user.user_metadata as Record<string, unknown> | null
    );

    let imageAnalysis: string | undefined;
    let imageUrl: string | undefined;
    const analysisResults: string[] = [];

    if (images.length > 0) {
      try {
        // Process all uploaded images
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          
          // Validate MIME type
          if (!image.type.startsWith('image/')) {
            console.warn(`[POST /api/chat] Image ${i + 1}: Invalid file type - must be an image`);
            continue;
          }

          console.log(`[POST /api/chat] Processing image ${i + 1}/${images.length}:`, { name: image.name, type: image.type, size: image.size });

          // Convert FormData file to Buffer
          const bytes = await image.arrayBuffer();
          const buffer = Buffer.from(bytes);
          console.log(`[POST /api/chat] Buffer created for image ${i + 1}:`, { bufferLength: buffer.length });
          
          // Upload image to Supabase and get public URL
          const uploadedImage = await uploadImage(buffer, image.type, 'uploaded', user.id, 'Chat uploaded image');
          
          // Keep first image URL for backward compatibility
          if (i === 0) {
            imageUrl = uploadedImage.url;
          }
          
          console.log(`[POST /api/chat] Image ${i + 1} uploaded:`, uploadedImage.url);
          
          // Analyze the image using the original buffer and MIME type
          console.log(`[POST /api/chat] Starting analysis for image ${i + 1}...`);
          const analysis = await analyzeImage(buffer, image.type);
          analysisResults.push(`Image ${i + 1}: ${analysis}`);
          console.log(`[POST /api/chat] Image ${i + 1} analyzed:`, analysis);
        }

        // Combine all analyses
        imageAnalysis = analysisResults.length > 0 
          ? analysisResults.join('\n\n')
          : 'Images uploaded and processed (no specific objects detected)';
          
      } catch (err) {
        console.error('[POST /api/chat] Image processing failed:', err);
        // Continue with chat even if image processing fails
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        imageAnalysis = `⚠️ Image(s) uploaded but analysis unavailable (${errorMessage}). You can still describe what you see!`;
        imageUrl = undefined;
      }
    }

    // Build user message with image context if available
    let userMessage = message;
    const hasImage = images.length > 0;
    
    if (images.length > 0) {
      const analysisText = imageAnalysis && imageAnalysis !== 'No identifiable objects found' 
        ? imageAnalysis 
        : 'Image uploaded and processed (no specific objects detected)';
      
      if (!message || message.trim() === '') {
        userMessage = `📸 Shared an image for analysis.\n\nImage Analysis: ${analysisText}`;
      } else {
        userMessage = `${message}\n\nImage Analysis: ${analysisText}`;
      }
    }

    console.log('[POST /api/chat] User message:', userMessage);
    console.log('[POST /api/chat] Has image:', hasImage);
    console.log('[POST /api/chat] Model preference:', modelPreference);

    // Build message content array for model router
    // When image is present, include it so classifyTier() detects it correctly
    const messageContent: string | MessageContent[] = hasImage
      ? [
          { type: 'text', text: userMessage || '' } as MessageContent,
          { type: 'image', image: 'data:image/webp;base64,' } as MessageContent,
        ]
      : userMessage || '';

    const messages = [{ role: 'user' as const, content: messageContent, id: 'user-msg' }];

    // ============================================
    // MODEL RESOLUTION (middleware layer)
    // ============================================
    // resolveModel() wraps the existing selectModel() as middleware.
    // If preference is 'auto', it fully delegates to the existing classifyTier() logic.
    // On any failure, it falls back to selectModel() — the pipeline is never broken.
    let selection;
    try {
      selection = resolveModel({
        preference: modelPreference,
        userTier,
        messages,
      });
      console.log(
        `[POST /api/chat] Resolved model: preference=${modelPreference} → modelId=${selection.modelId}, tier=${selection.tier}, auto=${selection.isAuto}`
      );
    } catch (resolverError) {
      // SAFETY FALLBACK: if resolver throws, use original selectModel() directly
      console.error('[POST /api/chat] resolveModel failed, using selectModel fallback:', resolverError);
      selection = selectModel(messages);
    }

    // Create conversation if needed
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      const newConversation = await createConversation(user.id, generateTitle(message || (hasImage ? 'Image shared' : 'New chat')));
      if (!newConversation) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }
      finalConversationId = newConversation.id;
      console.log('[POST /api/chat] Created new conversation:', finalConversationId);
    }

    // Save user message to database
    const userMessageRecord = await saveMessage(
      finalConversationId,
      'user',
      message || (hasImage ? '📸 Shared an image' : 'No message'),
      undefined,
      undefined,
      imageUrl
    );
    if (!userMessageRecord) {
      console.error('[POST /api/chat] Failed to save user message');
    }

    // Build system prompt: base + wisdom context
    const imageContextNote = hasImage 
      ? '\n\nThe user has shared an image with you. Always acknowledge that you\'ve received and analyzed the image.'
      : '';
    const wisdomContext = buildWisdomContext();
    const systemPrompt = FLOATGREENS_SYSTEM_PROMPT + imageContextNote + 
      (wisdomContext ? `\n\n## Plant Care Knowledge\n${wisdomContext}` : '');

    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: selection.model as any,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage || '' }],
    });

    // Save assistant message in background after we get the full text
    (async () => {
      try {
        const fullText = await result.text;
        const savedMessage = await saveMessage(
          finalConversationId,
          'assistant',
          fullText,
          selection.modelId,
          selection.tier
        );
        if (savedMessage) {
          console.log('[POST /api/chat] ✓ Saved assistant message to conversation');
        } else {
          console.error('[POST /api/chat] ✗ Message save returned null');
        }
      } catch (error) {
        console.error('[POST /api/chat] ✗ Failed to save assistant message:', error);
      }
    })();

    // Log model selection for monitoring
    console.log('[POST /api/chat] ✓ Response streaming:', {
      modelId: selection.modelId,
      tier: selection.tier,
      preference: modelPreference,
      userTier,
      conversationId: finalConversationId,
      hasImage,
    });

    const response = new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        // Safe header: client needs conversation ID for UI updates
        'X-Conversation-Id': finalConversationId,
        // Model headers intentionally omitted to prevent internal detail exposure
      },
    });

    return response;
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate response';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
