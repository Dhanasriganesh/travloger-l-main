import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient'

export async function POST() {
  try {
    const tables = []
    const errors = []

    // 1. Create packages table
    try {
      const { error: packagesError } = await supabase
        .from('packages')
        .select('id')
        .limit(1)
      
      if (packagesError && packagesError.code === 'PGRST116') {
        // Table doesn't exist, create it
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE packages (
              id BIGSERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              destination TEXT NOT NULL,
              duration TEXT NOT NULL,
              price DECIMAL(10,2) NOT NULL,
              original_price DECIMAL(10,2),
              description TEXT,
              highlights TEXT[] DEFAULT '{}',
              includes TEXT[] DEFAULT '{}',
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
            
            CREATE INDEX idx_packages_status ON packages(status);
            CREATE INDEX idx_packages_featured ON packages(featured);
            CREATE INDEX idx_packages_category ON packages(category);
            CREATE INDEX idx_packages_trip_type ON packages(trip_type);
            
            ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow all operations on packages" ON packages
              FOR ALL USING (true);
          `
        })
        
        if (createError) {
          errors.push(`Packages table: ${createError.message}`)
        } else {
          tables.push('packages')
        }
      } else {
        tables.push('packages (already exists)')
      }
    } catch (error) {
      errors.push(`Packages table: ${error.message}`)
    }

    // 2. Create employees table
    try {
      const { error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .limit(1)
      
      if (employeesError && employeesError.code === 'PGRST116') {
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE employees (
              id BIGSERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              destination TEXT,
              role TEXT DEFAULT 'employee',
              status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
              password_hash TEXT,
              is_first_login BOOLEAN DEFAULT true,
              inserted_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_employees_status ON employees(status);
            CREATE INDEX idx_employees_role ON employees(role);
            
            ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow all operations on employees" ON employees
              FOR ALL USING (true);
          `
        })
        
        if (createError) {
          errors.push(`Employees table: ${createError.message}`)
        } else {
          tables.push('employees')
        }
      } else {
        tables.push('employees (already exists)')
      }
    } catch (error) {
      errors.push(`Employees table: ${error.message}`)
    }

    // 3. Create bookings table
    try {
      const { error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .limit(1)
      
      if (bookingsError && bookingsError.code === 'PGRST116') {
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE bookings (
              id BIGSERIAL PRIMARY KEY,
              customer TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT,
              package_id BIGINT REFERENCES packages(id),
              package_name TEXT NOT NULL,
              destination TEXT NOT NULL,
              duration TEXT NOT NULL,
              travelers INTEGER DEFAULT 1,
              amount DECIMAL(10,2) NOT NULL,
              status TEXT DEFAULT 'Pending' CHECK (status IN ('Confirmed', 'Pending', 'Cancelled', 'Completed')),
              booking_date TIMESTAMPTZ DEFAULT NOW(),
              travel_date TIMESTAMPTZ,
              payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Partial', 'Pending', 'Refunded')),
              assigned_agent TEXT,
              notes TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_bookings_status ON bookings(status);
            CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
            CREATE INDEX idx_bookings_travel_date ON bookings(travel_date);
            
            ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow all operations on bookings" ON bookings
              FOR ALL USING (true);
          `
        })
        
        if (createError) {
          errors.push(`Bookings table: ${createError.message}`)
        } else {
          tables.push('bookings')
        }
      } else {
        tables.push('bookings (already exists)')
      }
    } catch (error) {
      errors.push(`Bookings table: ${error.message}`)
    }

    // 4. Create leads table
    try {
      const { error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .limit(1)
      
      if (leadsError && leadsError.code === 'PGRST116') {
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE leads (
              id BIGSERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              source TEXT DEFAULT 'Website',
              status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')),
              interest TEXT,
              budget DECIMAL(10,2),
              notes TEXT,
              assigned_agent TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_leads_status ON leads(status);
            CREATE INDEX idx_leads_source ON leads(source);
            
            ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow all operations on leads" ON leads
              FOR ALL USING (true);
          `
        })
        
        if (createError) {
          errors.push(`Leads table: ${createError.message}`)
        } else {
          tables.push('leads')
        }
      } else {
        tables.push('leads (already exists)')
      }
    } catch (error) {
      errors.push(`Leads table: ${error.message}`)
    }

    // 5. Create blogs table
    try {
      const { error: blogsError } = await supabase
        .from('blogs')
        .select('id')
        .limit(1)
      
      if (blogsError && blogsError.code === 'PGRST116') {
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE blogs (
              id BIGSERIAL PRIMARY KEY,
              title TEXT NOT NULL,
              slug TEXT UNIQUE NOT NULL,
              content TEXT NOT NULL,
              excerpt TEXT,
              featured_image TEXT,
              author TEXT DEFAULT 'Admin',
              status TEXT DEFAULT 'Draft' CHECK (status IN ('Published', 'Draft', 'Archived')),
              tags TEXT[] DEFAULT '{}',
              views INTEGER DEFAULT 0,
              published_at TIMESTAMPTZ,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_blogs_status ON blogs(status);
            CREATE INDEX idx_blogs_published_at ON blogs(published_at);
            
            ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow all operations on blogs" ON blogs
              FOR ALL USING (true);
          `
        })
        
        if (createError) {
          errors.push(`Blogs table: ${createError.message}`)
        } else {
          tables.push('blogs')
        }
      } else {
        tables.push('blogs (already exists)')
      }
    } catch (error) {
      errors.push(`Blogs table: ${error.message}`)
    }

    // 6. Create payments table
    try {
      const { error: paymentsError } = await supabase
        .from('payments')
        .select('id')
        .limit(1)
      
      if (paymentsError && paymentsError.code === 'PGRST116') {
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE payments (
              id BIGSERIAL PRIMARY KEY,
              booking_id BIGINT REFERENCES bookings(id),
              amount DECIMAL(10,2) NOT NULL,
              payment_method TEXT NOT NULL,
              transaction_id TEXT,
              status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
              payment_date TIMESTAMPTZ DEFAULT NOW(),
              notes TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_payments_status ON payments(status);
            CREATE INDEX idx_payments_booking_id ON payments(booking_id);
            
            ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow all operations on payments" ON payments
              FOR ALL USING (true);
          `
        })
        
        if (createError) {
          errors.push(`Payments table: ${createError.message}`)
        } else {
          tables.push('payments')
        }
      } else {
        tables.push('payments (already exists)')
      }
    } catch (error) {
      errors.push(`Payments table: ${error.message}`)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database setup completed',
      tables: tables,
      errors: errors.length > 0 ? errors : null
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Database setup failed',
      details: error.message 
    }, { status: 500 })
  }
}

