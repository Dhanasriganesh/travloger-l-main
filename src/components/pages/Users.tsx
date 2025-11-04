import React, { useEffect, useState } from 'react'

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

interface QueryStats {
  total: number
  new: number
  proposalSent: number
  noConnect: number
  hotLead: number
  totalProCon: number
  totalLost: number
  followUp: number
  confirmed: number
  invalid: number
}

const Queries: React.FC = () => {
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedQueries, setSelectedQueries] = useState<number[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [stats, setStats] = useState<QueryStats>({
    total: 0,
    new: 0,
    proposalSent: 0,
    noConnect: 0,
    hotLead: 0,
    totalProCon: 0,
    totalLost: 0,
    followUp: 0,
    confirmed: 0,
    invalid: 0
  })

  // Fetch queries data
  const fetchQueries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/leads')
      const data = await response.json()
      
      if (data.leads) {
        // Transform leads to queries with additional fields
        const transformedQueries: Query[] = data.leads.map((lead: any, index: number) => ({
          id: lead.id || (100000 + index), // Generate ID if missing
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
        }))
        setQueries(transformedQueries)
        calculateStats(transformedQueries)
      }
    } catch (error) {
      console.error('Failed to fetch queries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const calculateStats = (queryList: Query[]) => {
    const newStats: QueryStats = {
      total: queryList.length,
      new: queryList.filter(q => q.status === 'New').length,
      proposalSent: queryList.filter(q => q.status === 'Proposal Sent').length,
      noConnect: queryList.filter(q => q.status === 'No Connect').length,
      hotLead: queryList.filter(q => q.status === 'Hot Lead').length,
      totalProCon: queryList.filter(q => q.status === 'Proposal Sent').length + queryList.filter(q => q.status === 'Confirmed').length,
      totalLost: queryList.filter(q => q.status === 'Lost').length,
      followUp: queryList.filter(q => q.status === 'Follow Up').length,
      confirmed: queryList.filter(q => q.status === 'Confirmed').length,
      invalid: queryList.filter(q => q.status === 'Invalid').length
    }
    setStats(newStats)
  }

  useEffect(() => {
    fetchQueries()
  }, [])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queries</h1>
          <p className="text-gray-600">Manage customer queries and track their progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Add Query
          </button>
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
            Load Leads
          </button>
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center">
            Options
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center">
            Filter
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
        <div className="bg-gray-700 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.total}</div>
          <div className="text-xs">TOTAL</div>
        </div>
        <div className="bg-purple-600 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.new}</div>
          <div className="text-xs">NEW</div>
        </div>
        <div className="bg-teal-600 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.proposalSent}</div>
          <div className="text-xs">PROPOSAL SENT</div>
        </div>
        <div className="bg-teal-800 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.noConnect}</div>
          <div className="text-xs">NO CONNECT</div>
        </div>
        <div className="bg-red-600 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.hotLead}</div>
          <div className="text-xs">HOT LEAD</div>
        </div>
        <div className="bg-pink-600 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.totalProCon}</div>
          <div className="text-xs">TOTAL PRO.CON</div>
        </div>
        <div className="bg-gray-600 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.totalLost}</div>
          <div className="text-xs">TOTAL LOST</div>
        </div>
        <div className="bg-orange-500 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.followUp}</div>
          <div className="text-xs">FOLLOW UP</div>
        </div>
        <div className="bg-green-600 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.confirmed}</div>
          <div className="text-xs">CONFIRMED</div>
          </div>
        <div className="bg-red-500 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">{stats.invalid}</div>
          <div className="text-xs">INVALID</div>
        </div>
      </div>

      {/* Queries List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          <span className="ml-2 text-gray-600">Loading queries...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {getFilteredQueries().length > 0 ? (
            <div className="divide-y divide-gray-200">
              {getFilteredQueries().map((query) => (
                <div key={query.id} className="p-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Checkbox and ID */}
                    <div className="col-span-1 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedQueries.includes(query.id)}
                        onChange={() => handleQuerySelect(query.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="text-blue-600 font-medium text-sm">#{query.id}</div>
                    </div>

                    {/* Status Badge and Requirement */}
                    <div className="col-span-2">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          query.status === 'New' ? 'bg-purple-100 text-purple-800' :
                          query.status === 'Proposal Sent' ? 'bg-teal-100 text-teal-800' :
                          query.status === 'Hot Lead' ? 'bg-red-100 text-red-800' :
                          query.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          query.status === 'Follow Up' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {query.status}
                        </span>
                        <div className="text-sm text-gray-900">Requirement: {query.requirement}</div>
                        <a href="#" className="text-blue-600 text-sm flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          VIEW PROPOSAL ({query.proposals})
                        </a>
                      </div>
                    </div>

                    {/* Client Information */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{query.name} (Client)</div>
                        <div className="text-sm text-gray-600">Phone: {query.phone}</div>
                        <div className="text-sm text-gray-600">Email: {query.email}</div>
                        <div className="text-sm text-gray-600">Source: {query.source}</div>
                      </div>
                    </div>

                    {/* Destination & Travelers */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          Destination: <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{query.destination}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Travellers: {query.travelers?.adults || 2} Adult {query.travelers?.children || 0} Child {query.travelers?.infants || 0} Infant
                        </div>
                      </div>
                    </div>

                    {/* Dates & Assignment */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 flex items-center">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {query.travel_dates || '10-11-2025 Till 14-11-2025'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Assigned to: 
                          <select className="ml-1 text-blue-600 bg-transparent border-none focus:ring-0 text-sm">
                            <option>Assign to me</option>
                            <option>Unassigned</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Tasks & Notes */}
                    <div className="col-span-1">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">{query.tasks}</div>
                        <div className="text-sm text-gray-600 flex items-center">
                          {query.notes}
                          {query.notes !== 'No Notes' && (
                            <svg className="h-4 w-4 ml-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timestamps & Actions */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Created: {new Date(query.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Last Updated: {new Date(query.last_updated || query.created_at).toLocaleDateString()} - {new Date(query.last_updated || query.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No queries found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filterStatus !== 'all' 
                  ? `No queries found with status "${filterStatus}".`
                  : 'No queries have been created yet.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Queries
