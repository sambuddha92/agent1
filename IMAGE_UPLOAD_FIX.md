# Image Upload 400 Error - Fix Documentation

## Problem Summary
Image uploads were failing with a **400 (Bad Request)** error from Supabase storage. The error appeared as:
```
Failed to load resource: the server responded with a status of 400 ()
kkiacuqbitcidgomgklp.supabase.co/storage/v1/object/images/...
```

## Root Cause Analysis

### Issue 1: Missing `/public/` in URL Path
The error URL was missing the `/public/` segment required for public object access:
- **Incorrect:** `https://xxxx.supabase.co/storage/v1/object/images/{path}`
- **Correct:** `https://xxxx.supabase.co/storage/v1/object/public/images/{path}`

Without `/public/`, Supabase treats the request as private object access, requiring authentication headers. When the browser makes a simple image request (like in `<img>` tags), it fails with 400.

### Issue 2: Insufficient Storage Bucket Permissions
The storage bucket policies in `migrations/005_image_storage.sql` only allowed authenticated users to view images:
```sql
CREATE POLICY "Allow authenticated users to view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

This prevented public/anonymous access even though the bucket was marked as public. Browser image loads need a policy that allows unauthenticated access.

## Solutions Applied

### 1. New Migration: `011_fix_storage_public_access.sql`
Added a permissive public access policy:
```sql
-- Allow anonymous users to view public images
CREATE POLICY "Allow public access to images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Verify bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'images';
```

**Benefits:**
- ✅ Allows both authenticated and anonymous users to access images
- ✅ Enables browser image rendering without authentication
- ✅ Maintains security via row-level security on the `images` table

### 2. Enhanced URL Generation: `src/lib/supabase/image-client.ts`
Added defensive checks and logging to `getImageUrlClient()`:
- Validates that `NEXT_PUBLIC_SUPABASE_URL` is set
- Logs warnings if environment variable is missing
- Properly formats URLs with `/public/` segment
- Handles edge cases (trailing slashes, path formatting)

**Code changes:**
```typescript
export const getImageUrlClient = (path: string): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  if (!supabaseUrl) {
    console.warn('[getImageUrlClient] NEXT_PUBLIC_SUPABASE_URL is not set');
    return '';
  }
  
  const cleanUrl = supabaseUrl.replace(/\/$/, '');
  const fullUrl = `${cleanUrl}/storage/v1/object/public/images/${cleanPath}`;
  return fullUrl;
};
```

## Files Modified

1. **`supabase/migrations/011_fix_storage_public_access.sql`** (new)
   - Adds public access policy
   - Ensures bucket is marked as public

2. **`src/lib/supabase/image-client.ts`** (modified)
   - Enhanced URL generation with validation
   - Added environment variable checking
   - Improved error messaging

## Implementation Steps

1. **Apply the migration:**
   ```bash
   supabase migration up
   ```
   Or if using manual Supabase console, execute `011_fix_storage_public_access.sql`

2. **Verify environment variables:**
   Ensure your `.env.local` contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## Testing

After applying the fix:

1. **Upload an image** from the chat interface
2. **Check browser console** for any warnings about `NEXT_PUBLIC_SUPABASE_URL`
3. **Verify the URL** in the Network tab shows the correct format with `/public/`
4. **Confirm the image loads** without 400 errors

## Technical Notes

- **Server-side uploads** (via API route) use `supabase.storage.from('images').getPublicUrl()` which handles URL generation correctly
- **Client-side uploads** (via chat interface) use the enhanced `getImageUrlClient()` function
- The storage bucket's public flag ensures the URLs are publicly accessible
- RLS policies on the `images` table still control who can see image records in the database

## Security Considerations

✅ **Still secure because:**
- The storage bucket allows public read access (intentional for image serving)
- The `images` database table has RLS policies restricting visibility to image owners
- Users can only upload images through authenticated endpoints
- Unauthenticated users can view the public image URL but cannot delete or modify it
