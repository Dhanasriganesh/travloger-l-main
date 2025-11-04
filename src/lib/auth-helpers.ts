import { supabaseServer } from './supabaseServer'

export async function canAccessLead(leadId: string | number, employeeId: string | number): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer
      .from('leads')
      .select('assigned_employee_id')
      .eq('id', leadId)
      .single()

    if (error) {
      console.error('Error checking lead access:', error)
      return false
    }

    return data?.assigned_employee_id === employeeId
  } catch (error) {
    console.error('Error in canAccessLead:', error)
    return false
  }
}

