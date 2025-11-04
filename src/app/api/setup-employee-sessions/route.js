import { supabaseServer } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    // Create employee_sessions table using direct SQL
    const { error: createError } = await supabaseServer
      .from('employee_sessions')
      .select('id')
      .limit(1)
    // If table doesn't exist, create it
    if (createError && createError.code === 'PGRST116') {
      // Table doesn't exist, we need to create it via SQL
      // For now, we'll return instructions for manual creation
      res.status(200).json({ 
        success: false, 
        message: 'Please run the following SQL in your Supabase SQL editor to create the employee_sessions table:',
        sql: `
CREATE TABLE IF NOT EXISTS employee_sessions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL UNIQUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_sessions_employee_id ON employee_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_last_activity ON employee_sessions(last_activity);

-- Add foreign key constraint if employees table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    ALTER TABLE employee_sessions 
    ADD CONSTRAINT fk_employee_sessions_employee_id 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;
        `
      })
      return
    }

    if (createError) {
      console.error('Error checking employee_sessions table:', createError)
      return res.status(500).json({ error: 'Failed to check employee_sessions table' })
    }

    res.status(200).json({ 
      success: true, 
      message: 'Employee sessions table already exists' 
    })
  } catch (error) {
    console.error('Error setting up employee sessions:', error)
    res.status(500).json({ error: 'Failed to setup employee sessions' })
  }
}