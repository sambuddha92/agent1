/**
 * Input Validation Schemas
 *
 * Defines Zod schemas for all API request validation
 * Ensures type-safe, secure input handling across the application
 *
 * Usage:
 * ```
 * const result = chatRequestSchema.safeParse(data);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error.message }, { status: 400 });
 * }
 * const validated = result.data;
 * ```
 */

import { z } from 'zod';

// ============================================
// Image Validation
// ============================================

/**
 * Allowed image MIME types (security constraint)
 * Prevents non-image files from being processed
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Maximum image file size: 20 MB
 * Prevents DoS attacks via massive file uploads
 */
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB

export const imageFileSchema = z.object({
  type: z.enum(ALLOWED_IMAGE_TYPES)
    .refine(
      (type) => ALLOWED_IMAGE_TYPES.includes(type),
      { message: `Image must be one of: ${ALLOWED_IMAGE_TYPES.join(', ')}` }
    ),
  size: z.number()
    .max(MAX_IMAGE_SIZE, `Image must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`),
  name: z.string()
    .min(1, 'Image must have a filename')
    .max(255, 'Filename too long'),
});

// ============================================
// Chat Request Validation
// ============================================

/**
 * Maximum message length: 10,000 characters
 * Prevents storage bloat and API abuse
 */
const MAX_MESSAGE_LENGTH = 10000;

/**
 * Chat request validation schema
 * Validates FormData from POST /api/chat
 */
export const chatRequestSchema = z.object({
  message: z.string()
    .max(MAX_MESSAGE_LENGTH, `Message must be less than ${MAX_MESSAGE_LENGTH} characters`)
    .optional()
    .transform((val) => val?.trim() || ''),
  
  image: z.instanceof(File)
    .refine(
      (file) => file.size > 0,
      'Image file is empty'
    )
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.some(type => file.type === type),
      `Image must be one of: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    )
    .refine(
      (file) => file.size <= MAX_IMAGE_SIZE,
      `Image must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`
    )
    .optional(),
  
  conversationId: z.string()
    .uuid('Conversation ID must be a valid UUID')
    .optional(),
}).refine(
  (data) => data.message.length > 0 || data.image,
  { message: 'Either message or image is required', path: ['message'] }
);

// ============================================
// Conversation Validation
// ============================================

export const conversationIdSchema = z.string()
  .uuid('Conversation ID must be a valid UUID');

export const createConversationSchema = z.object({
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
});

// ============================================
// Image Upload Validation
// ============================================

export const imageUploadSchema = z.object({
  type: z.enum(['uploaded', 'generated']),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

// ============================================
// Error Response Type
// ============================================

export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Format Zod errors into user-friendly response
 *
 * @param error - Zod validation error
 * @returns Array of field/message pairs
 */
export function formatValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((err) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message,
  }));
}

/**
 * Safe parse helper with error formatting
 *
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Formatted error array or validated data
 */
export function validateAndFormat<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: formatValidationErrors(result.error),
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
}

// ============================================
// Type Exports
// ============================================

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateConversation = z.infer<typeof createConversationSchema>;
export type ImageUpload = z.infer<typeof imageUploadSchema>;
