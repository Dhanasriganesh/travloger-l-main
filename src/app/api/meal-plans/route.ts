import { NextResponse } from 'next/server'
import { Client } from 'pg'

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Unexpected error'

// GET all meal plans
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create meal_plans table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        description TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        -- legacy columns for backward compatibility
        name TEXT,
        destination TEXT,
        meal_type TEXT,
        price DECIMAL(10,2)
      );
      CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status);
    `)
    // Ensure new columns exist in legacy DBs
    await client.query(`
      ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS code TEXT;
      ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
      -- relax legacy NOT NULL constraints to allow code-first rows
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='meal_plans' AND column_name='name' AND is_nullable='NO'
        ) THEN
          ALTER TABLE meal_plans ALTER COLUMN name DROP NOT NULL;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='meal_plans' AND column_name='destination' AND is_nullable='NO'
        ) THEN
          ALTER TABLE meal_plans ALTER COLUMN destination DROP NOT NULL;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='meal_plans' AND column_name='meal_type' AND is_nullable='NO'
        ) THEN
          ALTER TABLE meal_plans ALTER COLUMN meal_type DROP NOT NULL;
        END IF;
      END $$;
    `)
    // Create code index only if the column exists (avoids errors on legacy DBs)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='meal_plans' AND column_name='code'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_meal_plans_code ON meal_plans(code);
        END IF;
      END $$;
    `)
    
    // Ensure column exists proactively (works even if it already exists)
    const hasCode = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='meal_plans' AND column_name='code'
      ) AS exists
    `)
    if (!hasCode.rows[0]?.exists) {
      await client.query(`ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS code TEXT;`)
    }

    const codeExists = !!hasCode.rows[0]?.exists
    const result = codeExists
      ? await client.query(`
          SELECT id, code, description, notes, status, created_by,
                 TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
          FROM meal_plans 
          ORDER BY created_at DESC
        `)
      : await client.query(`
          SELECT id,
                 COALESCE(meal_type, name, '') AS code,
                 '' AS description,
                 '' AS notes,
                 status, created_by,
                 TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
          FROM meal_plans
          ORDER BY created_at DESC
        `)
    return NextResponse.json({ mealPlans: result.rows })
  } catch (error: unknown) {
    console.error('Meal Plans GET error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new meal plan
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { code, description, notes, status } = body
    
    if (!code) {
      return NextResponse.json({ error: 'Meal plan code is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const codeExistsPost = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='meal_plans' AND column_name='code'
      ) AS exists
    `)
    const result = codeExistsPost.rows[0]?.exists
      ? await client.query(`
          INSERT INTO meal_plans (code, description, notes, status, name, meal_type, destination, price)
          VALUES ($1, $2, $3, $4, $1, $1, '', 0)
          RETURNING id, code, description, notes, status, created_by,
                    TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
        `, [code, description || '', notes || '', status || 'Active'])
      : await client.query(`
          INSERT INTO meal_plans (name, destination, meal_type, price, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, meal_type AS code, '' AS description, '' AS notes, status, created_by,
                    TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
        `, [code, '', code, 0, status || 'Active'])
    
    return NextResponse.json({ 
      mealPlan: result.rows[0],
      message: 'Meal plan created successfully'
    })
  } catch (error: unknown) {
    console.error('Meal Plans POST error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update meal plan
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, code, description, notes, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Meal plan ID is required' }, { status: 400 })
    }
    
    if (!code) {
      return NextResponse.json({ error: 'Meal plan code is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const codeExistsPut = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='meal_plans' AND column_name='code'
      ) AS exists
    `)
    const result = codeExistsPut.rows[0]?.exists
      ? await client.query(`
          UPDATE meal_plans 
          SET code = $1, description = $2, notes = $3, status = $4, name = $1, meal_type = $1, updated_at = NOW()
          WHERE id = $5
          RETURNING id, code, description, notes, status, created_by,
                    TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
        `, [code, description || '', notes || '', status || 'Active', id])
      : await client.query(`
          UPDATE meal_plans 
          SET name = $1, meal_type = $1, status = $2, updated_at = NOW()
          WHERE id = $3
          RETURNING id, meal_type AS code, '' AS description, '' AS notes, status, created_by,
                    TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
        `, [code, status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      mealPlan: result.rows[0],
      message: 'Meal plan updated successfully'
    })
  } catch (error: unknown) {
    console.error('Meal Plans PUT error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE meal plan
export async function DELETE(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Meal plan ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM meal_plans WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Meal plan deleted successfully' })
  } catch (error: unknown) {
    console.error('Meal Plans DELETE error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}


