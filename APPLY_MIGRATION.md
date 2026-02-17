# Apply Missing Database Migration

## Issue
The `conversations` and `chat_messages` tables are missing from your Supabase database. You need to apply migration `004_conversation_history.sql`.

## Solution

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://kkiacuqbitcidgomgklp.supabase.co
   - Login to your Supabase account

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Copy and Run Migration**
   - Open the file: `supabase/migrations/004_conversation_history.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should now see:
     - `conversations` table
     - `chat_messages` table

5. **Restart Your Dev Server**
   - Stop the running dev server (Ctrl+C)
   - Run `npm run dev` again
   - The conversation feature should now work!

### Option 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kkiacuqbitcidgomgklp

# Run migrations
supabase db push
```

## What This Migration Does

The migration creates:
- **conversations table**: Stores chat conversation sessions
- **chat_messages table**: Stores individual messages within conversations
- **Indexes**: For efficient querying
- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Triggers**: Auto-updates conversation timestamps

## Troubleshooting

If you get errors about missing functions:
- Make sure migrations 001, 002, and 003 were applied first
- The `update_updated_at_column()` function should exist from previous migrations

## After Migration

Once applied, your chat feature will:
- ✅ Save conversation history
- ✅ Load previous conversations
- ✅ Delete conversations
- ✅ Show conversation titles in sidebar
