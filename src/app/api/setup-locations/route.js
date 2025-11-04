import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

const createLocationTablesSql = `
-- Create hotel_locations table
CREATE TABLE IF NOT EXISTS hotel_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicle_locations table
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  rates JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fixed_locations table (for Fixed Plan)
CREATE TABLE IF NOT EXISTS fixed_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  map_rate INTEGER DEFAULT 0,
  eb INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  location_id UUID REFERENCES hotel_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type TEXT NOT NULL,
  rate INTEGER DEFAULT 0,
  ac_extra INTEGER DEFAULT 0,
  location_id UUID REFERENCES vehicle_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fixed_days table (for Fixed Plan packages)
CREATE TABLE IF NOT EXISTS fixed_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  days INTEGER NOT NULL,
  label TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fixed_plans table (for Fixed Plan name options per fixed location)
CREATE TABLE IF NOT EXISTS fixed_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  fixed_location_id UUID REFERENCES fixed_locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fixed_plan_options table (variants per plan)
CREATE TABLE IF NOT EXISTS fixed_plan_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  fixed_location_id UUID REFERENCES fixed_locations(id) ON DELETE CASCADE,
  fixed_plan_id UUID REFERENCES fixed_plans(id) ON DELETE CASCADE,
  adults INTEGER NOT NULL,
  price_per_person INTEGER NOT NULL,
  rooms_vehicle TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotel_locations_city ON hotel_locations(city);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_city ON vehicle_locations(city);
CREATE INDEX IF NOT EXISTS idx_fixed_locations_city ON fixed_locations(city);
CREATE INDEX IF NOT EXISTS idx_hotels_location_id ON hotels(location_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_id ON vehicles(location_id);
CREATE INDEX IF NOT EXISTS idx_fixed_days_city ON fixed_days(city);
CREATE INDEX IF NOT EXISTS idx_fixed_plans_loc ON fixed_plans(fixed_location_id);
CREATE INDEX IF NOT EXISTS idx_fixed_plan_options_plan ON fixed_plan_options(fixed_plan_id);

-- City CMS content table
CREATE TABLE IF NOT EXISTS city_content (
  slug TEXT PRIMARY KEY,
  hero JSONB,
  about JSONB,
  gallery JSONB DEFAULT '[]',
  contact JSONB,
  header JSONB,
  tripOptions JSONB,
  usp JSONB,
  faq JSONB,
  groupCta JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function POST() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({
      message: 'SUPABASE_DB_URL or DATABASE_URL not set. Please run the following SQL manually:',
      sql: createLocationTablesSql
    }, { status: 200 });
  }

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    await client.query(createLocationTablesSql);
    return NextResponse.json({ 
      executed: true, 
      message: 'Location tables created or already exist.' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating location tables:', error);
    return NextResponse.json({ 
      error: 'Failed to create location tables', 
      details: error.message 
    }, { status: 500 });
  } finally {
    await client.end();
  }
}
