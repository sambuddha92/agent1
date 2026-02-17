# 🔧 Foreign Key Constraint Fix

## Problem

The error `insert or update on table "user_context_memory" violates foreign key constraint "user_context_memory_user_id_fkey"` occurs when:

1. A user authenticates (creating an entry in `auth.users`)
2. The memory system tries to save memories for that user
3. But the user doesn't have a profile in the `public.users` table yet
4. The foreign key constraint `REFERENCES users(id)` fails

## Root Cause

The `users` table is manually populated during signup, which can fail if:
- The signup process is interrupted
- OAuth/social login is used (bypasses manual profile creation)
- There are race conditions between auth and profile creation
- The profile insert fails silently

## Solution

Automatically create user profiles using a database trigger that fires whenever a new user is created in `auth.users`.

## 📋 How to Apply the Fix

### Step 1: Open Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your FloatGreens project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration

Copy and paste the contents of `supabase/migrations/003_auto_create_user_profiles.sql` into the SQL Editor and run it.

Or run this command:

```sql
-- ============================================
-- Auto-create User Profiles
-- ============================================
-- Ensures users table is always in sync with auth.users
-- Fixes foreign key constraint violations in user_context_memory
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for existing auth users that don't have profiles yet
INSERT INTO public.users (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_user IS
  'Automatically creates a user profile in public.users when a new user signs up through Supabase Auth. This ensures foreign key constraints are never violated.';
```

### Step 3: Verify the Fix

Run this query to check:

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if all auth users have profiles
SELECT COUNT(*) as missing_profiles
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL;
-- Should return 0
```

## What This Fix Does

1. **Creates a trigger function** (`handle_new_user`) that automatically creates a user profile whenever a new user signs up
2. **Attaches the trigger** to `auth.users` table to fire on INSERT
3. **Backfills missing profiles** for any existing auth users who don't have profiles yet
4. **Uses `ON CONFLICT DO NOTHING`** to prevent duplicate key errors

## Benefits

- ✅ **Prevents future foreign key violations** - all new users automatically get profiles
- ✅ **Fixes existing users** - backfill creates missing profiles
- ✅ **Zero code changes** - purely database-level fix
- ✅ **Works with all auth methods** - email, OAuth, magic links, etc.
- ✅ **Idempotent** - safe to run multiple times

## Alternative: Quick Fix for Specific User

If you need to immediately fix a specific user, run:

```sql
-- Replace 'user-id-here' with the actual user ID from the error message
INSERT INTO public.users (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id = 'user-id-here'
ON CONFLICT (id) DO NOTHING;
```

## Testing

After applying the migration:

1. Create a new test user account
2. Check if their profile was auto-created:
```sql
SELECT u.* 
FROM auth.users au
JOIN public.users u ON u.id = au.id
WHERE au.email = 'test@example.com';
```
3. Try using the chat feature - memory system should work without errors

## Prevention

This migration ensures the issue never happens again. The trigger will always fire before the memory system tries to save data.

---

**Status**: Migration Ready ✅  
**Action Required**: Run the SQL in Supabase SQL Editor
