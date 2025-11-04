# Changes Now - Work Summary

This document records the changes made during the recent implementation session.

## Updated UI/Client Components

1) `src/lib/supabaseClient.js`
- Added safe runtime diagnostics to warn when Supabase env vars are missing.
- Fixed duplicate export issue.

2) `src/components/layout/Layout.tsx`
- Renamed sidebar label from “Packages” to “Itenarary Builder” (route unchanged: `/packages`).

3) `src/components/pages/cms/Packages.tsx`
- Marked as a client component (`'use client'`).
- Added location selection grid (Kashmir, Ladakh, Gokarna, Kerala, Meghalaya, Mysore, Singapore) when no city is selected.
- Introduced `cityName` (human-readable) derived from slug and used it:
  - For display in headers/empty states.
  - For create flow: `destination` set from input, `route` stores the location name.
- Create flow improvements:
  - Validations (city, plan, service type) and creating state.
  - Optimistic UI add + verification read.
  - Mapped payload to DB columns (name, destination, route, plan_type, service_type, selected hotel/vehicle, etc.).
- Fetching:
  - City-specific fetch now calls `/api/packages/city/{cityName}`.
- Bulk actions:
  - Added a helper to delete all itineraries for the selected city (kept commented in header controls).
- UI Cards:
  - Removed static image and price rows, bookings text, category chip, and view/publish controls as requested.
  - Display fields: status chip, name, destination, location (route), plan_type, service_type.
  - Resolved IDs to names for hotel/vehicle locations and selections by loading hotels/vehicles lists globally.

4) `src/components/pages/crm/Leads.tsx`
- Added Assign column with “Assign To” button per lead.
- Assign modal:
  - Loads employees filtered by `lead.destination` from `/api/employees?destination=...`.
  - Presents list with Assign button; posts to `/api/leads/assign` to persist assignment.
  - Backdrop uses subtle blur only (removed gray tint).

5) `src/components/pages/Employeedashboard.tsx`
- Loads employee destination via `/api/employees/by-email/:email`.
- Fetches itineraries for that destination using `/api/packages/city/{destination}`.
- Loads hotel/vehicle locations, hotels, vehicles for name resolution.
- Replaced packages list with Itinerary cards mirroring `Packages.tsx` (status, name, destination, location, plan/service, hotel/vehicle names).
- Added “Leads” section that shows cards for leads assigned to the logged-in employee (via `/api/leads?assignedTo={employeeId}`).

## API Endpoints (New/Updated)

1) NEW `src/app/api/employees/route.js`
- GET `/api/employees?destination=<city>` returns employees filtered by `destination` (or all when omitted).

2) NEW `src/app/api/leads/assign/route.ts`
- POST `/api/leads/assign` with `{ leadId, employeeId, employeeName, employeeEmail }` updates the given lead with assignment metadata (`assigned_employee_*`, `assigned_at`).

3) UPDATED `src/app/api/leads/route.ts`
- GET now accepts `assignedTo` to filter by `assigned_employee_id`.

4) UPDATED `src/app/api/packages/route.js`
- Insert now builds a minimal, safe `insertData` and conditionally adds optional fields.
- Added server-side error logging on insert error.

5) UPDATED `src/app/api/packages/city/[city]/route.js`
- Uses client `supabase` import.
- Query strategy: first exact match on `route` (location), fallback to `destination ILIKE` pattern.

## Database SQL Scripts (Supabase)

Placed helper scripts under `admin/`:
- `complete_sql_script.sql`: Adds core columns used by itinerary create form (route, plan_type, service_type, hotel/vehicle refs, etc.) and indexes.
- `sql_migration_scripts.sql`: Broader set including fixed-plan related fields and indexes.
- `drop_columns_script.sql`: Safely drops previously added columns/indexes if a reset is needed.

Lead assignment columns (run in Supabase SQL editor):
```
SET search_path TO public;
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_employee_id text,
  ADD COLUMN IF NOT EXISTS assigned_employee_name text,
  ADD COLUMN IF NOT EXISTS assigned_employee_email text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_employee_id ON public.leads (assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_destination ON public.leads (destination);
NOTIFY pgrst, 'reload schema';
```

## Behavior Changes Summary
- Itinerary creation is scoped to the selected city and stores `route` (location name) alongside the user-entered `destination`/`name`.
- Itinerary cards across admin and employee dashboards show minimal, relevant fields and human-readable hotel/vehicle names.
- Leads can be assigned to employees based on location; assigned leads appear on the employee dashboard.

## Files Touched
- `src/lib/supabaseClient.js`
- `src/components/layout/Layout.tsx`
- `src/components/pages/cms/Packages.tsx`
- `src/components/pages/crm/Leads.tsx`
- `src/components/pages/Employeedashboard.tsx`
- `src/app/api/packages/route.js`
- `src/app/api/packages/city/[city]/route.js`
- `src/app/api/employees/route.js` (new)
- `src/app/api/leads/assign/route.ts` (new)
- `src/app/api/leads/route.ts`
- `complete_sql_script.sql` (new)
- `sql_migration_scripts.sql` (new)
- `drop_columns_script.sql` (new)

## Notes
- After altering tables in Supabase, allow a few seconds for PostgREST schema cache to refresh.
- The Assign flow requires `leads.assigned_*` columns to exist.

