import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { Separator } from '../ui/separator'
import { ChevronDown, Filter, Eye, MessageCircle, Mail, Edit, Calendar, StickyNote, Clock } from 'lucide-react'

// Type definitions
interface Query {
  id: number
  name: string
  email: string
  phone: string
  destination: string
  created_at: string
  assigned_employee_name?: string
  status: 'New' | 'Proposal Sent' | 'No Connect' | 'Hot Lead' | 'Follow Up' | 'Confirmed' | 'Invalid' | 'Lost'
  requirement: string
  travelers?: {
    adults: number
    children: number
    infants: number
  }
  travel_dates?: string
  source: string
  notes?: string
  last_updated?: string
  proposals?: number
  tasks?: string
}

const Queries: React.FC = () => {
  const safeString = (value: unknown, fallback: string): string => {
    if (typeof value === 'string') return value
    if (value === null || value === undefined) return fallback
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return value.toString()
    }
    try {
      return String(value)
    } catch {
      return fallback
    }
  }

  const navigate = useNavigate()
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedQueries, setSelectedQueries] = useState<number[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false)

  // Fetch employees data
  const fetchEmployees = useCallback(async (destination?: string) => {
    setLoadingEmployees(true)
    try {
      const url = destination ? `/api/employees?destination=${encodeURIComponent(destination)}` : '/api/employees'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEmployees((data.employees || []).map((e: any) => ({ 
          id: String(e.id), 
          name: e.name, 
          email: e.email 
        })))
      } else {
        setEmployees([])
      }
    } catch (_) {
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Fetch queries data
  const fetchQueries = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/leads')
      const data = await response.json()
      
      if (data.leads) {
        const transformedQueries: Query[] = data.leads.map((lead: any, index: number) => {
          let displayId: number
          if (typeof lead.id === 'string' && lead.id.includes('-')) {
            displayId = 1000 + index
          } else if (typeof lead.id === 'number') {
            displayId = lead.id
          } else {
            displayId = 1000 + index
          }
          
          return {
            id: displayId,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            destination: lead.destination,
            created_at: lead.created_at,
            assigned_employee_name: lead.assigned_employee_name,
            status: lead.status || 'New',
            requirement: lead.custom_notes || 'Full package',
            travelers: {
              adults: parseInt(lead.number_of_travelers) || 2,
              children: 0,
              infants: 0
            },
            travel_dates: lead.travel_dates,
            source: lead.source || 'Facebook',
            notes: lead.custom_notes || 'No Notes',
            last_updated: lead.created_at,
            proposals: Math.floor(Math.random() * 6),
            tasks: 'No Task'
          }
        })
        setQueries(transformedQueries)
      }
    } catch (error) {
      console.error('Failed to fetch queries:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueries()
  }, [fetchQueries])

  // Filter queries based on status
  const getFilteredQueries = (): Query[] => {
    if (filterStatus === 'all') return queries
    return queries.filter(query => query.status.toLowerCase() === filterStatus.toLowerCase())
  }

  // Handle query selection
  const handleQuerySelect = (queryId: number) => {
    setSelectedQueries(prev => 
      prev.includes(queryId) 
        ? prev.filter(id => id !== queryId)
        : [...prev, queryId]
    )
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedQueries.length === getFilteredQueries().length) {
      setSelectedQueries([])
    } else {
      setSelectedQueries(getFilteredQueries().map(q => q.id))
    }
  }

  // Handle status update
  const handleStatusUpdate = async (queryId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads?id=${queryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          last_updated: new Date().toISOString()
        }),
      })

      if (response.ok) {
        setQueries(prev => prev.map(q => 
          q.id === queryId 
            ? { ...q, status: newStatus as any, last_updated: new Date().toISOString() }
            : q
        ))
        const updatedQueries = queries.map(q => 
          q.id === queryId 
            ? { ...q, status: newStatus as any, last_updated: new Date().toISOString() }
            : q
        )
      } else {
        console.error('Failed to update query status')
      }
    } catch (error) {
      console.error('Error updating query status:', error)
    }
  }

  // Handle assignment update
  const handleAssignmentUpdate = async (queryId: number, employeeName: string) => {
    try {
      // Find the employee by name to get their email
      const employee = employees.find(emp => emp.name === employeeName)
      if (!employee && employeeName) {
        console.error('Employee not found')
        return
      }

      const response = await fetch('/api/leads/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: queryId,
          employeeId: employee?.id || '',
          employeeName: employee?.name || '',
          employeeEmail: employee?.email || ''
        }),
      })

      if (response.ok) {
        // Update the query in the local state
        setQueries(prev => prev.map(q => 
          q.id === queryId 
            ? { 
                ...q, 
                assigned_employee_name: employee?.name || '',
                last_updated: new Date().toISOString()
              }
            : q
        ))
        
        // Show success message
        if (employee) {
          alert(`Successfully assigned query to ${employee.name}. Emails have been sent with relevant details.`)
        } else {
          alert('Query has been unassigned.')
        }
      } else {
        const err = await response.json().catch(() => ({}))
        alert(err.error || 'Failed to update query assignment')
      }
    } catch (error) {
      console.error('Error updating query assignment:', error)
      alert('Failed to update query assignment')
    }
  }

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedQueries.length === 0) return

    try {
      const promises = selectedQueries.map(queryId => 
        handleStatusUpdate(queryId, newStatus)
      )
      await Promise.all(promises)
      setSelectedQueries([])
    } catch (error) {
      console.error('Error in bulk status update:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Queries</h1>
          <div className="flex items-center space-x-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Query
            </Button>
            <Button variant="outline" onClick={fetchQueries}>
              Load Leads
            </Button>
            <Button variant="outline" className="flex items-center">
              Options
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="flex items-center">
              Filter
              <Filter className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


      {/* Queries List */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <span className="ml-4 text-gray-600 font-medium">Loading queries...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredQueries().length > 0 ? (
              getFilteredQueries().map((query) => (
                <div key={query.id} className="bg-white border border-gray-200 rounded overflow-hidden">
                  {/* Main Card Content */}
                  <div className="p-1.5">
                    {/* Single Row Layout */}
                    <div className="flex items-center justify-between">
                      {/* Left Section - Checkbox, ID, Status, HOT badge, Requirement */}
                      <div className="flex items-center space-x-2 w-48">
                        <input
                          type="checkbox"
                          checked={selectedQueries.includes(query.id)}
                          onChange={() => handleQuerySelect(query.id)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <button 
                          className="text-blue-600 font-bold text-sm hover:underline"
                          onClick={() => navigate(`/queries/${query.id}`)}
                        >
                          {query.id}
                        </button>
                        <Badge className="bg-purple-500 text-white text-xs px-1 py-0.5">
                          {safeString(query.status, 'New')}
                        </Badge>
                        {query.status === 'Hot Lead' && (
                          <Badge className="bg-red-500 text-white text-xs px-1 py-0.5">
                            HOT
                          </Badge>
                        )}
                        <div className="text-xs">
                          <div className="text-gray-500">Requirement</div>
                          <div className="font-medium text-gray-900">
                            {safeString(query.requirement, 'Full package')}
                          </div>
                        </div>
                      </div>

                      {/* Client Information */}
                      <div className="w-40">
                        <div className="font-bold text-gray-900 text-xs">
                          Mr. {safeString(query.name, 'Unknown')} (Client)
                        </div>
                        <div className="text-xs text-gray-600">
                          {safeString(query.phone, 'No phone')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {safeString(query.email, 'No email')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {safeString(query.source, 'Unknown')}
                        </div>
                      </div>

                      {/* Destination & Travelers */}
                      <div className="w-32">
                        <div className="text-xs text-gray-500">Destination</div>
                        <Badge className="bg-gray-800 text-white text-xs px-1 py-0.5 mb-1">
                          {safeString(query.destination, 'Unknown')}
                        </Badge>
                        <div className="text-xs text-gray-500">Travellers</div>
                        <div className="text-xs text-gray-900">
                          {query.travelers?.adults || 2} Adult {query.travelers?.children || 0} Child {query.travelers?.infants || 0} Infant
                        </div>
                      </div>

                      {/* Dates & Assignment */}
                      <div className="w-32">
                        <div className="flex items-center text-xs text-gray-900 mb-1">
                          <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                          10-11-2025
                        </div>
                        <div className="text-xs text-gray-500 ml-4 mb-1">Till 14-11-2025</div>
                        <div className="text-xs text-gray-500">Assigned to</div>
                        {loadingEmployees ? (
                          <div className="flex items-center space-x-1 h-4">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500">Loading...</span>
                          </div>
                        ) : (
                          <Select 
                            value={query.assigned_employee_name || ''}
                            onChange={(e) => handleAssignmentUpdate(query.id, (e.target as HTMLSelectElement).value)}
                            className="h-4 px-1 text-xs font-medium text-blue-700 bg-white border border-gray-300 rounded"
                          >
                            <option value="">Assign to...</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.name}>
                                {emp.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>

                      {/* Tasks & Notes */}
                      <div className="w-24">
                        <div className="text-xs text-gray-900 mb-1">
                          {safeString(query.tasks, 'No Task')}
                        </div>
                        <div className="flex items-center text-xs text-orange-600 mb-1">
                          <div className="w-2 h-2 bg-orange-500 rounded mr-1"></div>
                          No Notes
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          Created
                        </div>
                        <div className="text-xs text-gray-900 ml-4">{new Date(query.created_at).toLocaleDateString()}</div>
                      </div>

                      {/* Action Icons & Last Updated */}
                      <div className="w-32">
                        <div className="flex items-center space-x-0.5 bg-white border border-gray-300 rounded p-0.5 mb-1">
                          <button className="p-0.5 hover:bg-gray-100 rounded">
                            <Eye className="h-3 w-3 text-gray-600" />
                          </button>
                          <button className="p-0.5 hover:bg-gray-100 rounded">
                            <MessageCircle className="h-3 w-3 text-green-600" />
                          </button>
                          <button className="p-0.5 hover:bg-gray-100 rounded">
                            <Mail className="h-3 w-3 text-blue-600" />
                          </button>
                          <button className="p-0.5 hover:bg-gray-100 rounded">
                            <Edit className="h-3 w-3 text-purple-600" />
                          </button>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          Last Updated
                        </div>
                        <div className="text-xs text-gray-900 ml-4">
                          {new Date(query.last_updated || query.created_at).toLocaleDateString()} - {new Date(query.last_updated || query.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>

                      {/* VIEW PROPOSAL */}
                      <div className="w-32">
                        <button className="w-full bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded hover:bg-blue-700 flex items-center justify-center">
                          <Eye className="h-3 w-3 mr-1" />
                          VIEW PROPOSAL ({query.proposals})
                        </button>
                        
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-12 h-12 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No queries found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {filterStatus !== 'all' 
                    ? `No queries found with status "${filterStatus}". Try changing the filter or check back later.`
                    : 'No queries have been created yet. Start by adding your first query.'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Queries