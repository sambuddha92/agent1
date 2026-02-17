-- ============================================
-- Model Upgrade Interest Tracking
-- ============================================
-- Logs when a free user clicks "Upgrade" on a locked model tier.
-- Used to measure demand for paid features.
-- ============================================

-- Upgrade interest table
CREATE TABLE IF NOT EXISTS model_upgrade_interest (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  model_tier  TEXT NOT NULL CHECK (model_tier IN ('best', 'T3')),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_upgrade_interest_user_id
  ON model_upgrade_interest(user_id);

CREATE INDEX IF NOT EXISTS idx_model_upgrade_interest_timestamp
  ON model_upgrade_interest(timestamp DESC);

-- Row Level Security
ALTER TABLE model_upgrade_interest ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interest records
CREATE POLICY "Users can insert own upgrade interest" ON model_upgrade_interest
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own records
CREATE POLICY "Users can view own upgrade interest" ON model_upgrade_interest
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access (for admin analytics)
CREATE POLICY "Service role can manage upgrade interest" ON model_upgrade_interest
  FOR ALL USING (true) WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE model_upgrade_interest IS
  'Tracks when free users click Upgrade on locked model tiers. Used to measure feature demand.';

COMMENT ON COLUMN model_upgrade_interest.model_tier IS
  'The tier the user attempted to access. Currently only "best" (T3) is locked for free users.';
