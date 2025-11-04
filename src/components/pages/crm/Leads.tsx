import React, { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  destination: string
  number_of_travelers: string
  travel_dates: string
  custom_notes: string
  created_at: string
  assigned_employee_id?: string
  assigned_employee_name?: string
  assigned_employee_email?: string
}


type FilterType = string

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [destinations, setDestinations] = useState<string[]>([])
  const [loadingDestinations, setLoadingDestinations] = useState<boolean>(false)

  // Fetch destinations
  const fetchDestinations = useCallback(async () => {
    try {
      setLoadingDestinations(true)
      const response = await fetch('/api/destinations')
      if (response.ok) {
        const data = await response.json()
        // Extract name property from destination objects and remove duplicates
        const uniqueDestinations = [...new Set((data.destinations || [])
          .map(dest => dest?.name || dest)
          .filter(Boolean)
        )]
        setDestinations(uniqueDestinations)
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
    } finally {
      setLoadingDestinations(false)
    }
  }, [])

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null)
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [assigning, setAssigning] = useState<boolean>(false)

  // Create lead modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    number_of_travelers: '',
    travel_dates: '',
    source: 'Meta Ads',
    custom_source: '',
    destination: 'Kashmir',
    custom_notes: ''
  })
  const [isCreating, setIsCreating] = useState<boolean>(false)

  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/leads')
        const data = await response.json()
        
        if (response.ok) {
          setLeads(data.leads || [])
          setError(null)
        } else {
          setError(data.error || 'Failed to fetch leads')
        }
      } catch (err) {
        setError('Failed to fetch leads')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
    fetchDestinations()
  }, [fetchDestinations])

  // Filter leads based on month, year, and date
  const getFilteredLeads = (): Lead[] => {
    if (selectedMonth === 'all' && selectedYear === 'all' && selectedDate === 'all') return leads

    const filteredLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at)
      const leadMonth = (leadDate.getMonth() + 1).toString() // getMonth() returns 0-11, so add 1
      const leadYear = leadDate.getFullYear().toString()
      const leadDateStr = leadDate.toISOString().split('T')[0] // YYYY-MM-DD format

      const monthMatch = selectedMonth === 'all' || leadMonth === selectedMonth
      const yearMatch = selectedYear === 'all' || leadYear === selectedYear
      const dateMatch = selectedDate === 'all' || leadDateStr === selectedDate

      return monthMatch && yearMatch && dateMatch
    })

    return filteredLeads
  }

  const filteredLeads = getFilteredLeads().filter(lead => {
    if (filter === 'all') return true
    return lead.destination === filter
  })

  const getSourceColor = (source: string): string => {
    return 'bg-slate-100 text-slate-800'
  }

  const getDestinationColor = (destination: string): string => {
    return 'bg-slate-100 text-slate-800'
  }

  const openLeadDetails = (lead: Lead): void => {
    setSelectedLead(lead)
    setShowModal(true)
  }

  const handleDeleteLead = async (leadId: string): Promise<void> => {
    try {
      setDeleting(true)
      const response = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId })
      })
      
      if (response.ok) {
        setLeads(leads.filter(lead => lead.id !== leadId))
        setShowDeleteModal(false)
        setLeadToDelete(null)
        alert('Lead record deleted successfully')
      } else {
        const data = await response.json()
        alert('Failed to delete lead: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead record')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteModal = (lead: Lead): void => {
    setLeadToDelete(lead)
    setShowDeleteModal(true)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openAssignModal = async (lead: Lead) => {
    setAssigningLead(lead)
    setShowAssignModal(true)
    setSearchTerm('')
    setLoadingEmployees(true)
    try {
      const res = await fetch(`/api/employees?destination=${encodeURIComponent(lead.destination)}`)
      if (res.ok) {
        const data = await res.json()
        setEmployees((data.employees || []).map((e: any) => ({ id: String(e.id), name: e.name, email: e.email })))
      } else {
        setEmployees([])
      }
    } catch (_) {
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleAssignLead = async (employeeId: string, employeeName: string, employeeEmail: string) => {
    if (!assigningLead) return
    
    setAssigning(true)
    try {
      const res = await fetch('/api/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: assigningLead.id,
          employeeId: employeeId,
          employeeName: employeeName,
          employeeEmail: employeeEmail
        })
      })
      
      if (res.ok) {
        // Update the lead in the local state
        setLeads(prev => prev.map(lead => 
          lead.id === assigningLead.id 
            ? { 
                ...lead, 
                assigned_employee_id: employeeId,
                assigned_employee_name: employeeName,
                assigned_employee_email: employeeEmail
              }
            : lead
        ))
        
        // Update the assigning lead state
        setAssigningLead(prev => prev ? {
          ...prev,
          assigned_employee_id: employeeId,
          assigned_employee_name: employeeName,
          assigned_employee_email: employeeEmail
        } : null)
        
        alert(`Successfully assigned lead to ${employeeName}. Emails have been sent to both the customer (${assigningLead.email}) and the employee (${employeeEmail}) with relevant details.`)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to assign lead')
      }
    } catch (error) {
      console.error('Error assigning lead:', error)
      alert('Failed to assign lead')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignLead = async () => {
    if (!assigningLead) return
    
    try {
      const res = await fetch('/api/leads/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: assigningLead.id
        })
      })
      
      if (res.ok) {
        // Update the lead in the local state
        setLeads(prev => prev.map(lead => 
          lead.id === assigningLead.id 
            ? { 
                ...lead, 
                assigned_employee_id: undefined,
                assigned_employee_name: undefined,
                assigned_employee_email: undefined
              }
            : lead
        ))
        
        // Update the assigning lead state
        setAssigningLead(prev => prev ? {
          ...prev,
          assigned_employee_id: undefined,
          assigned_employee_name: undefined,
          assigned_employee_email: undefined
        } : null)
        
        alert('Lead unassigned successfully')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to unassign lead')
      }
    } catch (error) {
      console.error('Error unassigning lead:', error)
      alert('Failed to unassign lead')
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.phone) {
      alert('Please fill in all required fields (Name, Email, Contact Number)')
      return
    }

    if (newLead.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    setIsCreating(true)
    try {
      const leadData = {
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        number_of_travelers: newLead.number_of_travelers,
        travel_dates: newLead.travel_dates,
        source: newLead.source === 'Custom' ? newLead.custom_source : newLead.source,
        destination: newLead.destination,
        custom_notes: newLead.custom_notes
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      })

      if (response.ok) {
        let createdLead: any = null
        try {
          createdLead = await response.json()
        } catch (_) {
          createdLead = null
        }
        if (createdLead?.lead) {
          setLeads(prev => [createdLead.lead, ...prev])
        }
        setShowCreateModal(false)
        setNewLead({
          name: '',
          email: '',
          phone: '',
          number_of_travelers: '',
          travel_dates: '',
          source: 'Meta Ads',
          custom_source: '',
          destination: 'Kashmir',
          custom_notes: ''
        })
        alert('Lead created successfully!')
      } else {
        let errorMessage = 'Failed to create lead'
        try {
          const text = await response.text()
          if (text) {
            const parsed = JSON.parse(text)
            errorMessage = parsed.error || errorMessage
          }
        } catch (_) {
          // ignore parse errors, use default message
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      alert('Failed to create lead')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Leads Management</h1>
          <p className="text-sm text-gray-600">Manage and track customer inquiries</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSelectedDate('all')}
              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              All Dates
            </button>
          </div>

          {/* Month Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          
          {/* Year Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
          <div className="flex space-x-2">
            {getFilteredLeads().filter(lead => {
              const leadDate = new Date(lead.created_at)
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              return leadDate < thirtyDaysAgo
            }).length > 0 && (
              <button 
                onClick={() => {
                  const oldLeads = getFilteredLeads().filter(lead => {
                    const leadDate = new Date(lead.created_at)
                    const thirtyDaysAgo = new Date()
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                    return leadDate < thirtyDaysAgo
                  })
                  if (confirm(`Delete ${oldLeads.length} leads older than 30 days? This action cannot be undone.`)) {
                    // Bulk delete old leads
                    oldLeads.forEach(lead => {
                      handleDeleteLead(lead.id)
                    })
                  }
                }}
                className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Clean Old ({getFilteredLeads().filter(lead => {
                  const leadDate = new Date(lead.created_at)
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return leadDate < thirtyDaysAgo
                }).length})
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">L</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-800 truncate">Total Leads</dt>
                  <dd className="text-sm font-medium text-slate-800">{leads.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">E</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-800 truncate">Enquiries</dt>
                  <dd className="text-sm font-medium text-slate-800">{leads.filter(l => l.source === 'enquiry').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">S</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-800 truncate">Social Leads</dt>
                  <dd className="text-sm font-medium text-slate-800">
                    {leads.filter(l => 
                      l.source === 'Meta Ads' || 
                      l.source === 'Whatsapp' || 
                      l.source === 'google_ads' ||
                      l.source === 'facebook' ||
                      l.source === 'instagram' ||
                      l.source === 'twitter' ||
                      l.source === 'linkedin'
                    ).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">T</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-800 truncate">Today</dt>
                  <dd className="text-sm font-medium text-slate-800">
                    {leads.filter(l => {
                      const today = new Date().toDateString()
                      const leadDate = new Date(l.created_at).toDateString()
                      return today === leadDate
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({leads.length})
          </button>
          {loadingDestinations ? (
            <div className="flex items-center space-x-2 px-3 py-1">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-gray-500">Loading filters...</span>
            </div>
          ) : (
            destinations.map((destination, index) => {
              const count = leads.filter(l => l.destination === destination).length;
              return (
                <button
                  key={`${destination}-${index}`}
                  onClick={() => setFilter(destination)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === destination ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {String(destination)} ({count})
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">Loading leads...</div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">No leads found</div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travelers</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travel Dates</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">{lead.name || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{lead.email || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{lead.phone || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getSourceColor(lead.source)}`}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {lead.number_of_travelers || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {lead.travel_dates || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getDestinationColor(lead.destination)}`}>
                        {lead.destination || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {lead.assigned_employee_id ? (
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                            Assigned
                          </span>
                          <button
                            onClick={() => openAssignModal(lead)}
                            className="text-slate-800 hover:opacity-80 text-xs"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAssignModal(lead)}
                          className="px-2 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 text-xs"
                        >
                          Assign To
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <button
                        onClick={() => openLeadDetails(lead)}
                        className="text-slate-800 hover:opacity-80 mr-3"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => openDeleteModal(lead)}
                        className="text-red-500 hover:text-red-600 text-xs"
                        title="Delete Lead Record"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead Details Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Lead Details</h3>
                    <p className="text-white/80 text-xs">Customer information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Lead Avatar & Basic Info */}
              <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedLead.name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">{selectedLead.name || 'N/A'}</h4>
                    <p className="text-gray-600 text-sm mb-2">{selectedLead.email || 'N/A'}</p>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                        <svg className="w-2 h-2 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedLead.destination || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Contact Information</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Email</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.email || 'N/A'}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Phone</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Travel Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Travel Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Travelers</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.number_of_travelers || 'N/A'}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Travel Dates</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.travel_dates || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Additional Information</span>
                </h4>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Source</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.source}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Notes</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.custom_notes || 'No notes'}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Submitted</span>
                    </div>
                    <p className="text-sm text-gray-900">{formatDate(selectedLead.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-4 py-3 border-t border-slate-200">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
               
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Lead Modal */}
      {showAssignModal && assigningLead && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Assign Lead</h3>
                    <p className="text-white/80 text-xs">Manage lead assignment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssignModal(false)} 
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(85vh-100px)]">
              {/* Lead Info Card */}
              <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {assigningLead.name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{assigningLead.name}</h4>
                    <p className="text-gray-600 text-xs mb-1">{assigningLead.email}</p>
                    <div className="flex items-center space-x-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                        <svg className="w-2 h-2 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {assigningLead.destination}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Assignment Status */}
              {assigningLead.assigned_employee_id && (
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-800 mb-0.5">Currently Assigned</div>
                        <div className="text-sm font-semibold text-gray-900">{assigningLead.assigned_employee_name}</div>
                        <div className="text-xs text-gray-600">{assigningLead.assigned_employee_email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleUnassignLead}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Unassign</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Search Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Available Employees</span>
                </h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                  <svg className="absolute left-2 top-2.5 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Employee List */}
              <div className="space-y-2">
                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-800"></div>
                      <span className="text-gray-600 text-xs">Loading employees...</span>
                    </div>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-xs">
                      {searchTerm ? 'No employees found matching your search.' : 'No employees found for this location.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredEmployees.map(emp => {
                      const isAssigned = emp.id === assigningLead.assigned_employee_id
                      return (
                        <div 
                          key={emp.id} 
                          className={`p-2 rounded-lg border transition-all duration-200 ${
                            isAssigned 
                              ? 'bg-slate-100 border-slate-200 shadow-sm' 
                              : 'bg-white border-gray-200 hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isAssigned 
                                  ? 'bg-slate-800' 
                                  : 'bg-gray-400'
                              }`}>
                                <span className="text-white font-semibold text-xs">
                                  {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-xs">{emp.name}</div>
                                <div className="text-xs text-gray-600">{emp.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isAssigned ? (
                                <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-xs font-medium">
                                    Assigned
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAssignLead(emp.id, emp.name, emp.email)}
                                  disabled={assigning}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                  {assigning ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      <span>Assigning...</span>
                                    </>
                                  ) : (
                                    <span>Assign</span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-4 py-3 border-t border-slate-200">
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowAssignModal(false)} 
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Create New Lead</h3>
                    <p className="text-white/80 text-xs">Add a new customer inquiry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Basic Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Basic Information</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newLead.name}
                      onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number *</label>
                    <input
                      type="tel"
                      value={newLead.phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                        setNewLead({ ...newLead, phone: digitsOnly })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Travel Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Travel Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Travellers</label>
                    <input
                      type="number"
                      value={newLead.number_of_travelers}
                      onChange={(e) => setNewLead({ ...newLead, number_of_travelers: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Number of travelers"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Travel Dates</label>
                    <input
                      type="date"
                      value={newLead.travel_dates}
                      onChange={(e) => setNewLead({ ...newLead, travel_dates: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destination</label>
                  {loadingDestinations ? (
                    <div className="flex items-center space-x-2 h-8">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-gray-500">Loading destinations...</span>
                    </div>
                  ) : (
                    <select
                      value={newLead.destination}
                      onChange={(e) => setNewLead({ ...newLead, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select destination</option>
                      {destinations.map((destination, index) => (
                        <option key={`${destination}-${index}`} value={String(destination)}>
                          {String(destination)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Lead Source */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Lead Source</span>
                </h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lead From</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value, custom_source: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Whatsapp">Whatsapp</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                {newLead.source === 'Custom' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Custom Source</label>
                    <input
                      type="text"
                      value={newLead.custom_source}
                      onChange={(e) => setNewLead({ ...newLead, custom_source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter custom source"
                    />
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Additional Notes</span>
                </h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newLead.custom_notes}
                    onChange={(e) => setNewLead({ ...newLead, custom_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                    placeholder="Enter any additional notes or comments"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-4 py-3 border-t border-slate-200">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLead}
                  disabled={isCreating}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Create Lead</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && leadToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Lead Record</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to delete this lead record?
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {leadToDelete.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {leadToDelete.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {leadToDelete.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Destination:</strong> {leadToDelete.destination}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Source:</strong> {leadToDelete.source}
                  </p>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. The lead record will be permanently removed from the database.
                </p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteLead(leadToDelete.id)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Record'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Leads
