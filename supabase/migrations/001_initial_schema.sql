-- ============================================
-- FloatGreens Database Schema
-- ============================================
-- Initial schema for Weekend MVP
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  postal_code_prefix TEXT,
  city TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Balconies/Growing Spaces
CREATE TABLE balconies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'My Balcony',
  orientation TEXT CHECK (orientation IN ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')),
  dimensions_m2 DECIMAL,
  floor_level INTEGER,
  sun_hours_estimated DECIMAL,
  climate_zone TEXT,
  wind_exposure TEXT CHECK (wind_exposure IN ('sheltered', 'moderate', 'exposed')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plants inventory
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balcony_id UUID REFERENCES balconies(id) ON DELETE CASCADE NOT NULL,
  species TEXT NOT NULL,
  variety TEXT,
  nickname TEXT,
  container_size_liters DECIMAL,
  position_description TEXT,
  acquired_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'deceased', 'harvested')),
  swap_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Health snapshots (photo analysis history)
CREATE TABLE health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  issues_detected JSONB,
  growth_stage TEXT CHECK (growth_stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'dormant')),
  height_cm_estimated DECIMAL,
  ai_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Harvest logs
CREATE TABLE harvest_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  harvest_date DATE NOT NULL,
  quantity_grams DECIMAL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bloom Map entries (community sharing)
CREATE TABLE bloom_map_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  postal_prefix TEXT NOT NULL,
  orientation TEXT,
  plant_species TEXT[],
  container_types TEXT[],
  style_tags TEXT[],
  sketch_url TEXT NOT NULL,
  season TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent actions log (proactive notifications)
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'acted_on', 'dismissed')),
  scheduled_for TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_balconies_user_id ON balconies(user_id);
CREATE INDEX idx_plants_balcony_id ON plants(balcony_id);
CREATE INDEX idx_plants_status ON plants(status);
CREATE INDEX idx_health_snapshots_plant_id ON health_snapshots(plant_id);
CREATE INDEX idx_health_snapshots_created_at ON health_snapshots(created_at DESC);
CREATE INDEX idx_bloom_map_postal ON bloom_map_entries(postal_prefix);
CREATE INDEX idx_agent_actions_user_status ON agent_actions(user_id, status);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE balconies ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloom_map_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Users: can only see and update their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Balconies: users can only access their own
CREATE POLICY "Users can view own balconies" ON balconies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balconies" ON balconies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balconies" ON balconies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own balconies" ON balconies FOR DELETE USING (auth.uid() = user_id);

-- Plants: access through balcony ownership
CREATE POLICY "Users can view own plants" ON plants FOR SELECT 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can insert own plants" ON plants FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can update own plants" ON plants FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));
CREATE POLICY "Users can delete own plants" ON plants FOR DELETE 
  USING (EXISTS (SELECT 1 FROM balconies WHERE balconies.id = plants.balcony_id AND balconies.user_id = auth.uid()));

-- Health snapshots: access through plant ownership
CREATE POLICY "Users can view own health snapshots" ON health_snapshots FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM plants p 
    JOIN balconies b ON b.id = p.balcony_id 
    WHERE p.id = health_snapshots.plant_id AND b.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own health snapshots" ON health_snapshots FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM plants p 
    JOIN balconies b ON b.id = p.balcony_id 
    WHERE p.id = health_snapshots.plant_id AND b.user_id = auth.uid()
  ));

-- Harvest logs: access through plant ownership
CREATE POLICY "Users can view own harvest logs" ON harvest_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM plants p 
    JOIN balconies b ON b.id = p.balcony_id 
    WHERE p.id = harvest_logs.plant_id AND b.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own harvest logs" ON harvest_logs FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM plants p 
    JOIN balconies b ON b.id = p.balcony_id 
    WHERE p.id = harvest_logs.plant_id AND b.user_id = auth.uid()
  ));

-- Bloom Map: public read, own entries write
CREATE POLICY "Anyone can view public bloom entries" ON bloom_map_entries FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own bloom entries" ON bloom_map_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bloom entries" ON bloom_map_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bloom entries" ON bloom_map_entries FOR DELETE USING (auth.uid() = user_id);

-- Agent actions: users can only see their own
CREATE POLICY "Users can view own agent actions" ON agent_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert agent actions" ON agent_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own agent actions" ON agent_actions FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_balconies_updated_at BEFORE UPDATE ON balconies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
