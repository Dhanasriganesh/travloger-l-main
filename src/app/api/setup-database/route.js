import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    // Create packages table
    const { error: packagesError } = await supabase.rpc('create_packages_table')
    
    if (packagesError) {
      console.log('Creating packages table manually...')
      
      // If RPC doesn't work, we'll create the table using SQL
      const { error: createError } = await supabase
        .from('packages')
        .select('id')
        .limit(1)
      
      if (createError && createError.code === 'PGRST116') {
        // Table doesn't exist, we need to create it
        return NextResponse.json({ 
          message: 'Please create the packages table in your Supabase dashboard with the following SQL:',
          sql: `
CREATE TABLE packages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  description TEXT,
  highlights TEXT[],
  includes TEXT[],
  category TEXT DEFAULT 'Adventure',
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Active', 'Inactive', 'Draft')),
  featured BOOLEAN DEFAULT FALSE,
  image TEXT,
  route TEXT,
  nights INTEGER DEFAULT 0,
  days INTEGER DEFAULT 0,
  trip_type TEXT DEFAULT 'custom' CHECK (trip_type IN ('custom', 'group')),
  bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_featured ON packages(featured);
CREATE INDEX idx_packages_category ON packages(category);
CREATE INDEX idx_packages_trip_type ON packages(trip_type);

-- Enable Row Level Security (RLS)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on packages" ON packages
  FOR ALL USING (true);
          `
        }, { status: 200 })
      }
    }

    return NextResponse.json({ 
      message: 'Database setup completed successfully',
      tables: ['packages']
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database setup failed',
      details: error.message 
    }, { status: 500 })
  }
}

