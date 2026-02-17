import { createClient } from '@/lib/supabase/server';
import { analyzeImage } from '@/lib/ai/image-analysis';
import { selectModel } from '@/lib/ai/model-router';
import { uploadImage } from '@/lib/supabase/image-storage';
import { createConversation, saveMessage, generateTitle } from '@/lib/conversations';
import { FLOATGREENS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { chatRequestSchema, validateAndFormat } from '@/lib/validation';
import { chatRateLimiter } from '@/lib/rate-limit';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const formData = await request.formData();

    // Extract and validate input using Zod schema
    const message = formData.get('message') as string | null;
    const image = formData.get('image') as File | null;
    const conversationId = formData.get('conversationId') as string | null;

    // Validate request data
    const validation = validateAndFormat(chatRequestSchema, {
      message: message || '',
      image: image || undefined,
      conversationId: conversationId || undefined,
    });

    if (!validation.success) {
      console.warn('[POST /api/chat] Validation failed:', validation.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const validated = validation.data;

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

    let imageAnalysis: string | undefined;
    let imageUrl: string | undefined;
    if (image) {
      try {
        // Validate MIME type
        if (!image.type.startsWith('image/')) {
          throw new Error('Invalid file type - must be an image');
        }

        console.log('[POST /api/chat] Processing image:', { name: image.name, type: image.type, size: image.size });

        // Convert FormData file to Buffer
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        console.log('[POST /api/chat] Buffer created:', { bufferLength: buffer.length });
        
        // Upload image to Supabase and get public URL
        const uploadedImage = await uploadImage(buffer, image.type, 'uploaded', user.id, 'Chat uploaded image');
        imageUrl = uploadedImage.url;
        console.log('[POST /api/chat] Image uploaded:', imageUrl);
        
        // Analyze the image using the original buffer and MIME type
        console.log('[POST /api/chat] Starting image analysis...');
        imageAnalysis = await analyzeImage(buffer, image.type);
        console.log('[POST /api/chat] Image analyzed:', imageAnalysis);
      } catch (err) {
        console.error('[POST /api/chat] Image processing failed:', err);
        // Continue with chat even if image processing fails - don't block the entire request
        // But provide informative feedback to user about what went wrong
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        imageAnalysis = `⚠️ Image uploaded but analysis unavailable (${errorMessage}). You can still describe what you see!`;
        imageUrl = undefined; // Don't include broken URL
      }
    }

    // Build user message with image context if available
    let userMessage = message;
    let hasImage = !!image;
    
    if (image) {
      // Always include image analysis, even if it's "no objects found"
      const analysisText = imageAnalysis && imageAnalysis !== 'No identifiable objects found' 
        ? imageAnalysis 
        : 'Image uploaded and processed (no specific objects detected)';
      
      // If user didn't provide text, still mention the image
      if (!message || message.trim() === '') {
        userMessage = `📸 Shared an image for analysis.\n\nImage Analysis: ${analysisText}`;
      } else {
        userMessage = `${message}\n\nImage Analysis: ${analysisText}`;
      }
    }

    console.log('[POST /api/chat] User message:', userMessage);
    console.log('[POST /api/chat] Has image:', hasImage);
    console.log('[POST /api/chat] Image URL:', imageUrl);

    // Select model based on message complexity
    const selection = selectModel([
      { role: 'user' as const, content: userMessage, id: 'user-msg' }
    ]);

    console.log('[POST /api/chat] Selected model:', selection.modelId, 'Tier:', selection.tier);

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

    // Generate streaming response with image context
    // Use single source of truth from prompts.ts
    const imageContextNote = hasImage 
      ? '\n\nThe user has shared an image with you. Always acknowledge that you\'ve received and analyzed the image.'
      : '';
    const systemPrompt = FLOATGREENS_SYSTEM_PROMPT + imageContextNote;

    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: selection.model as any,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Save assistant message in background after we get the full text
    // Use async IIFE to properly handle the promise without blocking response
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
        // Consider implementing retry logic or dead letter queue for failed saves
      }
    })();

    // Log model selection for monitoring (not exposed to client)
    console.log('[POST /api/chat] ✓ Response streaming:', {
      modelId: selection.modelId,
      tier: selection.tier,
      conversationId: finalConversationId,
      hasImage: hasImage,
    });

    // Create response with secure headers (no internal metadata exposed)
    // X-Conversation-Id is safe to expose - client needs it to track messages
    // X-Model-* headers removed to prevent information leakage
    const response = new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        // Safe header: client needs conversation ID for UI updates
        'X-Conversation-Id': finalConversationId,
        // Remove X-Model-Id and X-Model-Tier to prevent internal detail exposure
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
