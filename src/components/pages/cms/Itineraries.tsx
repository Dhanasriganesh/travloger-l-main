'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../../ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '../../ui/dropdown-menu'
import { Badge } from '../../ui/badge'
import { Loader2, Plus, MoreHorizontal, Copy, Pencil, Trash2, Search, MapPin } from 'lucide-react'

interface Itinerary {
  id: number
  name: string
  start_date: string | null
  end_date: string | null
  adults: number
  children: number
  destinations: string
  notes?: string
  price: number
  marketplace_shared: boolean
  created_at: string
  updated_at: string
  totalPrice?: number // Calculated total from all events
}

const Itineraries: React.FC = () => {
  const [rows, setRows] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [destinations, setDestinations] = useState<string[]>([])
  const [showDestinationsDropdown, setShowDestinationsDropdown] = useState(false)
  const [destinationInput, setDestinationInput] = useState('')
  const navigate = useNavigate()

  // Function to calculate total price from all events
  const calculateTotalPrice = useCallback(async (itineraryId: number): Promise<number> => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/events`)
      if (!response.ok) return 0
      
      const data = await response.json()
      const events = data.events || []
      
      let total = 0
      events.forEach((event: any) => {
        const eventData = event.event_data
        if (eventData && eventData.price) {
          // Parse price as number
          const price = typeof eventData.price === 'string' 
            ? parseFloat(eventData.price) 
            : eventData.price
          if (!isNaN(price)) {
            total += price
          }
        }
      })
      
      return total
    } catch (error) {
      console.error('Error calculating total price:', error)
      return 0
    }
  }, [])

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    adults: 1,
    children: 0,
    destinations: [] as string[],
    notes: ''
  })

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/itineraries')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const itineraries = data.itineraries || []
        
        // Calculate total price for each itinerary
        const itinerariesWithTotalPrice = await Promise.all(
          itineraries.map(async (itinerary: Itinerary) => {
            const totalPrice = await calculateTotalPrice(itinerary.id)
            return { ...itinerary, totalPrice }
          })
        )
        
        setRows(itinerariesWithTotalPrice)
        setError(null)
      } else {
        setError(data.error || 'Failed to load itineraries')
      }
    } catch {
      setError('Failed to load itineraries')
    } finally {
      setLoading(false)
    }
  }, [calculateTotalPrice])

  const fetchDestinations = useCallback(async () => {
    try {
      const res = await fetch('/api/destinations')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setDestinations(data.destinations?.map((d: any) => d.name) || [])
      }
    } catch (error) {
      console.error('Failed to fetch destinations:', error)
    }
  }, [])

  // Ensure all destinations exist in master before creating/updating itinerary
  const ensureDestinationsExist = async (names: string[]): Promise<void> => {
    const trimmed = names.map(n => n.trim()).filter(Boolean)
    if (trimmed.length === 0) return
    const existingLower = new Set(destinations.map(d => d.toLowerCase()))
    const toCreate = trimmed.filter(n => !existingLower.has(n.toLowerCase()))
    if (toCreate.length === 0) return
    await Promise.all(
      toCreate.map(async (name) => {
        try {
          const res = await fetch('/api/destinations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          })
          if (res.ok) {
            // Optimistically add to local list so user can select immediately
            setDestinations(prev => [...prev, name])
          }
        } catch {
          // Ignore single insert failures; itinerary can still be created
        }
      })
    )
  }

  useEffect(() => { 
    fetchRows()
    fetchDestinations()
  }, [fetchRows, fetchDestinations])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => (r.name || '').toLowerCase().includes(q))
  }, [rows, search])

  const filteredDestinations = useMemo(() => {
    if (!destinationInput.trim()) return destinations
    const query = destinationInput.toLowerCase()
    return destinations.filter(dest => 
      dest.toLowerCase().includes(query) && !form.destinations.includes(dest)
    ).slice(0, 5) // Limit to 5 suggestions
  }, [destinations, destinationInput, form.destinations])

  const durationDays = (r: Itinerary): number | null => {
    if (!r.start_date || !r.end_date) return null
    const s = new Date(r.start_date)
    const e = new Date(r.end_date)
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff
  }

  const addDestination = (destination: string) => {
    if (destination.trim() && !form.destinations.includes(destination.trim())) {
      setForm({ ...form, destinations: [...form.destinations, destination.trim()] })
      setDestinationInput('')
      setShowDestinationsDropdown(false)
    }
  }

  const removeDestination = (destination: string) => {
    setForm({ ...form, destinations: form.destinations.filter(d => d !== destination) })
  }

  const handleDestinationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (destinationInput.trim()) {
        addDestination(destinationInput.trim())
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold text-gray-900">Itineraries</h1>
            
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  placeholder="Search by name"
                  className="pl-7 py-1.5 text-sm rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <Button
              onClick={() => {
                setEditingId(null)
                setForm({ name: '', startDate: '', endDate: '', adults: 1, children: 0, destinations: [], notes: '' })
                setDestinationInput('')
                setShowModal(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded"
            >
              Create itinerary
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading itineraries...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <div className="text-red-600 font-medium">{error}</div>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No itineraries found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first itinerary</p>
              <Button 
                onClick={() => {
                  setEditingId(null)
                  setForm({ name: '', startDate: '', endDate: '', adults: 1, children: 0, destinations: [], notes: '' })
                  setDestinationInput('')
                  setShowModal(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Itinerary
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Place</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <button 
                            onClick={() => navigate(`/packages/${r.id}`)}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {r.name}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {r.id} - {r.destinations} | {r.adults} Adult(s) - {r.children} Child(s)
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {durationDays(r) ? `${durationDays(r)} Days` : 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-gray-800">
                          ₹{(r.totalPrice || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/itineraries/${r.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  ...r,
                                  marketplace_shared: !r.marketplace_shared
                                })
                              })
                              const data = await res.json().catch(() => ({}))
                              if (res.ok) {
                                setRows(prev => prev.map(item => 
                                  item.id === r.id 
                                    ? { ...item, marketplace_shared: !item.marketplace_shared }
                                    : item
                                ))
                              } else {
                                alert(data.error || 'Failed to update marketplace status')
                              }
                            } catch (error) {
                              console.error('Error updating marketplace status:', error)
                              alert('Error updating marketplace status')
                            }
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium text-white cursor-pointer hover:opacity-80 transition-opacity ${
                            r.marketplace_shared ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          {r.marketplace_shared ? 'Shared' : 'Not Share'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(r.updated_at || r.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center">
                              <MoreHorizontal className="w-4 h-4 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(r.id)
                                setForm({
                                  name: r.name,
                                  startDate: r.start_date?.substring(0, 10) || '',
                                  endDate: r.end_date?.substring(0, 10) || '',
                                  adults: r.adults,
                                  children: r.children,
                                  destinations: r.destinations ? r.destinations.split(', ').filter(d => d.trim()) : [],
                                  notes: r.notes || ''
                                })
                                setDestinationInput('')
                                setShowModal(true)
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Itinerary
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                const payload = { ...r, name: `${r.name} Copy` }
                                const res = await fetch('/api/itineraries', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(payload)
                                })
                                const data = await res.json().catch(() => ({}))
                                if (res.ok) setRows(prev => [data.itinerary, ...prev])
                                else alert(data.error || 'Failed to duplicate')
                              }}
                              className="cursor-pointer"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this itinerary?')) return
                            const res = await fetch(`/api/itineraries/${r.id}`, { method: 'DELETE' })
                            if (res.ok) setRows(prev => prev.filter(x => x.id !== r.id))
                            else alert('Failed to delete itinerary')
                          }}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal - Sliding Panel */}
        {showModal && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-40" onClick={() => setShowModal(false)} />
            
            {/* Sliding Panel */}
            <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 animate-slide-in-right flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingId ? 'Edit Itinerary' : 'Create New Itinerary'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {editingId ? 'Update your itinerary details below.' : 'Fill in the details to create a new itinerary.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Itinerary Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter itinerary name"
                      value={form.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, startDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, endDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Number of adults"
                        value={form.adults}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, adults: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Number of children"
                        value={form.children}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, children: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinations<span className="text-red-500">*</span>
                    </label>
                    <div className="w-full min-h-[42px] border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                      {/* Selected Destinations Chips */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {form.destinations.map((destination, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                          >
                            <span>{destination}</span>
                            <button
                              type="button"
                              onClick={() => removeDestination(destination)}
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Input Field */}
                      <input
                        type="text"
                        placeholder={form.destinations.length === 0 ? "Enter destinations (e.g., Kerala, Munnar, Thekkady)" : "Enter Destination"}
                        value={destinationInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setDestinationInput(e.target.value)
                          setShowDestinationsDropdown(e.target.value.trim().length > 0)
                        }}
                        onFocus={() => setShowDestinationsDropdown(destinationInput.trim().length > 0)}
                        onBlur={() => setTimeout(() => setShowDestinationsDropdown(false), 200)}
                        onKeyPress={handleDestinationKeyPress}
                        className="w-full border-none outline-none text-sm"
                        required={form.destinations.length === 0}
                      />
                      
                      {/* Autocomplete Dropdown */}
                      {showDestinationsDropdown && filteredDestinations.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredDestinations.map((destination, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                              onClick={() => addDestination(destination)}
                            >
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{destination}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                      placeholder="Additional notes or special requirements..."
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons - Sticky */}
              <div className="flex gap-2 p-3 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={async () => {
                    // Auto-include any typed destination that hasn't been added as a chip yet
                    const pending = destinationInput.trim()
                    const finalDestinations = Array.from(new Set([
                      ...form.destinations,
                      ...(pending && !form.destinations.includes(pending) ? [pending] : [])
                    ]))

                    if (!form.name.trim() || finalDestinations.length === 0) {
                      alert('Please fill in all required fields (Name and Destinations)')
                      return
                    }
                    try {
                      setSaving(true)
                      // Create any new destinations missing from master
                      await ensureDestinationsExist(finalDestinations)
                      const endpoint = editingId ? `/api/itineraries/${editingId}` : '/api/itineraries'
                      const method = editingId ? 'PUT' : 'POST'
                      const payload = {
                        ...form,
                        destinations: finalDestinations.join(', ') // Convert array to comma-separated string for API
                      }
                      const res = await fetch(endpoint, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                      })
                      const data = await res.json().catch(() => ({}))
                      if (res.ok) {
                        if (editingId)
                          setRows(prev => prev.map(r => (r.id === editingId ? data.itinerary : r)))
                        else setRows(prev => [data.itinerary, ...prev])
                        // Refresh destinations from server to keep in sync
                        fetchDestinations()
                        setShowModal(false)
                        setEditingId(null)
                        setForm({ name: '', startDate: '', endDate: '', adults: 1, children: 0, destinations: [], notes: '' })
                        setDestinationInput('')
                      } else {
                        alert(data.error || 'Failed to save itinerary')
                      }
                    } finally {
                      setSaving(false)
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1 inline" />
                      {editingId ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Itineraries
